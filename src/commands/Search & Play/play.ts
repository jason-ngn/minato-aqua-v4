import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import { isUserInVoiceChannel } from '../../checks'
import constants from "../../constants";
import { getThumbnail, getTrackInfo } from "../../functions";
import erela from "../../index"

export default class Play extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'play',
        nameLocalizations: {
          vi: 'phát'
        },
        description: 'Phát nhạc bằng từ khoá hoặc URL',
        options: [
          {
            name: 'query',
            nameLocalizations: {
              vi: 'từ-khoá'
            },
            description: "Từ khoá hoặc URL.",
            required: true,
            type: ApplicationCommandOptionType.String,
          }
        ]
      },
      clientPermissions: ['Connect', 'Speak'],
      checks: [isUserInVoiceChannel],
      callback: async ({
        interaction,
        options,
        member,
        guild,
        channel,
        user
      }) => {
        await interaction.deferReply();

        const query = options.getString('query', true)

        let player = erela.players.get(guild.id);

        if (!player) {
          player = erela.create({
            voiceChannel: member.voice.channel!.id,
            textChannel: channel!.id,
            guild: guild.id,
            selfDeafen: true,
            selfMute: false,
          });
        }

        const results = await erela.search({
          query: query,
          source: 'soundcloud',
        }, user)

        if (results.loadType === 'LOAD_FAILED') {
          return await interaction.editReply({
            content: `Không thể tìm bài hát mà bạn đã yêu cầu.`
          })
        }

        if (['TRACK_LOADED', "SEARCH_RESULT"].includes(results.loadType)) {
          const track = results.tracks[0]

          player.queue.add(track);

          const embed = new EmbedBuilder()
            .setColor(constants.embed.color)
            .setAuthor({
              name: `Đã thêm vào hàng đợi`
            })
            .setDescription(`[${track.title}](${track.uri})`)

          const thumbnail = await getThumbnail(track.uri);
          if (thumbnail) embed.setThumbnail(thumbnail)

          await interaction.editReply({
            embeds: [embed]
          })
        } else if (results.loadType === 'PLAYLIST_LOADED') {
          for (const track of results.tracks) {
            player.queue.add(track);
          }

          const embed = new EmbedBuilder()
            .setColor(constants.embed.color)
            .setAuthor({
              name: `Đã thêm vào hàng đợi`
            })
            .setDescription(`Đã thêm **${results.tracks.length.toLocaleString()}** bài hát từ danh sách phát **${results.playlist!.name}** vào hàng đợi.`)

          await interaction.editReply({
            embeds: [embed]
          })
        }

        if (!player.playing && !player.paused) {
          player.connect();
          await player.play()
        }
      }
    })
  }
}