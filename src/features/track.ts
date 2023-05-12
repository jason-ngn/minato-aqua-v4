import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, Client, Collection, CommandInteraction, ComponentType, EmbedBuilder, GuildMember, GuildTextBasedChannel, InteractionCollector, Message, Snowflake, TextChannel, User } from "discord.js";
import { Player } from "erela.js";
import { Track } from "erela.js";
import { FeatureTemplate } from "icytea-command-handler";
import erela from "..";
import constants from "../constants";
import emoji from "../emoji";
import { getRelatedTracks, getThumbnail } from "../functions";
import Playlist from "./playlist";

export const messageCache = new Collection<Snowflake, Message>();
export const trackCache = new Collection<Snowflake, string[]>();
export const announceSongsCache = new Collection<Snowflake, boolean | undefined>();
export const volumesCache = new Collection<Snowflake, number | undefined>();
export const collectorCache = new Collection<
  Snowflake,
  InteractionCollector<ButtonInteraction<CacheType>>
>();

const favoriteButtonId = 'favorite';

export default class TrackStart extends FeatureTemplate {
  public static readonly shared = new TrackStart()
  public readonly autoplays: Collection<Snowflake, boolean> = new Collection();

  public async init(client: Client<boolean>): Promise<void> {
    erela
      .on('trackStart', async player => {
        const guild = client.guilds.cache.get(player.guild);
        const channel = guild?.channels.cache.get(player.textChannel!) as TextChannel;
        if (!guild || !channel) return;

        const m = messageCache.get(guild.id);

        if (m) {
          try {
            if (m.deletable) await m.delete();
          } catch (e) { }
        }

        const currentTrack = player.queue.current!;

        trackCache.set(guild.id, [...(trackCache.get(guild.id) || []), currentTrack.uri!]);

        messageCache.delete(guild.id);
        collectorCache.delete(guild.id);

        const pixelHeart = client.emojis.cache.get(emoji.pixelHeart)!.identifier;

        const embed = new EmbedBuilder()
          .setColor(constants.embed.color)
          .setTitle(`Đang phát`)
          .setDescription(`[${currentTrack.title}](${currentTrack.uri})\nbởi **${currentTrack.author}**`)

        const thumbnail = await getThumbnail(currentTrack.uri!);

        if (thumbnail) embed.setThumbnail(thumbnail)

        const favoriteButton = new ButtonBuilder()
          .setCustomId(favoriteButtonId)
          .setEmoji(pixelHeart)
          .setStyle(ButtonStyle.Secondary)

        const message = await channel.send({
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(favoriteButton)
          ]
        })

        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button
        })

        messageCache.set(guild.id, message);

        collector.on('collect', async interaction => {
          await interaction.deferUpdate();

          const user = interaction.user;

          if (interaction.customId === favoriteButtonId) {
            let favoritesPlaylist = await Playlist.shared.createPlaylist(client, user.id, constants.favoritesPlaylistName);

            const songInPlaylist = favoritesPlaylist.tracks.find(track => track.uri === currentTrack.uri) ? true : false;
            await Playlist.shared.updatePlaylist(user.id, constants.favoritesPlaylistName, currentTrack.uri!, songInPlaylist ? 'remove' : 'add');

            await interaction.followUp({
              ephemeral: true,
              content: songInPlaylist ? `Đã xoá [${currentTrack.title}](<${currentTrack.uri}>) khỏi các bài hát yêu thích.` : `Đã thêm [${currentTrack.title}](<${currentTrack.uri}>) vào các bài hát yêu thích.`
            })

            return;
          }
        })

        collector.on('end', async () => {
          const msg = messageCache.get(guild.id);

          if (!msg) return;

          try {
            await msg.edit({
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(ButtonBuilder.from(favoriteButton).setDisabled(true))
              ]
            })
          } catch (e) {
            return;
          }

          try {
            if (msg.deletable) await msg.delete();
          } catch (e) { }

        })
        collectorCache.set(guild.id, collector as any);
      })
      .on('trackEnd', async (player) => {
        const guild = client.guilds.cache.get(player.guild);

        if (!guild) return;
        const collector = collectorCache.get(guild?.id);

        if (!collector) return;

        collector.stop();
      })
  }

  public setAutoplay(guildId: Snowflake, autoplay: boolean) {
    this.autoplays.set(guildId, autoplay);

    return this;
  }

  public async autoplay(client: Client, player: Player) {
    const guild = client.guilds.cache.get(player.guild)!;
    const autoplay = this.autoplays.get(guild.id);
    const channel = guild.channels.cache.get(player.textChannel!) as TextChannel;

    if (autoplay === true) {
      const guildTrackCache = trackCache.get(guild.id);
      if (!guildTrackCache || !guildTrackCache.length) return;
      const currentTrackUrl = guildTrackCache[guildTrackCache.length - 1];
      const relatedTracks = await getRelatedTracks(currentTrackUrl, client.user!);

      if (!relatedTracks) {
        await channel.send({
          content: `Không thể tìm kiếm bài hát liên quan tới bài hát hiện tại.`
        })

        return;
      }

      if (player.state === 'DISCONNECTED') return;

      player.queue.add(relatedTracks[0]);
      if (!player.paused && !player.playing) await player.play();
    }
  }
}

export function resetTrackCache(guildId: Snowflake) {
  trackCache.set(guildId, []);
};