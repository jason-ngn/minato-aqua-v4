import { ApplicationCommandOptionType, ComponentType, EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import { SoundcloudTrackV2, SoundcloudUserV2, SoundcloudUserSearchV2 } from "soundcloud.ts";
import constants from "../../constants";
import emojis from "../../emoji";
import { formatDuration, getUserTracks, isSoundcloudURL, searchUser } from "../../functions";

const selectMenuId = 'select-menu';
const cancelButtonId = 'cancel';
const allTracksButtonId = 'all-tracks';
const popularTracksButtonId = 'popular-tracks';

export default class User extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'user',
        nameLocalizations: {
          vi: 'người-dùng'
        },
        description: "Tìm kiếm người dùng dựa trên từ khoá.",
        options: [
          {
            name: 'query',
            nameLocalizations: {
              vi: 'từ-khoá'
            },
            description: 'Từ khoá hoặc URL.',
            required: true,
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      callback: async ({
        interaction,
        client,
        guild,
        member,
        user,
        options
      }) => {
        await interaction.deferReply();

        const query = options.getString('query', true);

        const results = await searchUser(query);
        const scVerified = client.emojis.cache.get(emojis.soundcloudVerified);

        if (!results) {
          return await interaction.editReply({
            content: `Không thể tìm người dùng mà bạn yêu cầu.`
          })
        }

        const checkType = 'collection' in results && Array.isArray(results.collection);

        if (checkType && results.collection.length > 25) {
          results.collection = results.collection.slice(0, 25);
        }

        const users = (checkType ? results.collection : [results]) as SoundcloudUserV2[];

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(selectMenuId)
          .setPlaceholder(`Chọn người dùng bạn muốn tìm kiếm ở đây.`)
          .setMaxValues(1)

        const cancelButton = new ButtonBuilder()
          .setCustomId(cancelButtonId)
          .setStyle(ButtonStyle.Secondary)
          .setLabel(`Huỷ tìm kiếm`)

        const allTracksButton = new ButtonBuilder()
          .setCustomId(allTracksButtonId)
          .setStyle(ButtonStyle.Secondary)
          .setLabel(`Tất cả bài hát`)

        const popularTracksButton = new ButtonBuilder()
          .setCustomId(popularTracksButtonId)
          .setStyle(ButtonStyle.Secondary)
          .setLabel(`Những bài hát phổ biến`)

        const generateActionRow = (customId: string) => {
          const customIdEqualsAllTrack = customId === allTracksButtonId;

          const firstButton = ButtonBuilder.from(popularTracksButton)
            .setStyle(customIdEqualsAllTrack ? ButtonStyle.Secondary : ButtonStyle.Primary)
          const secondButton = ButtonBuilder.from(allTracksButton)
            .setStyle(customIdEqualsAllTrack ? ButtonStyle.Primary : ButtonStyle.Secondary)

          return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(firstButton, secondButton)
        }

        const generateActionRowDisabled = (customId: string) => {
          const customIdEqualsAllTrack = customId === allTracksButtonId;

          const firstButton = ButtonBuilder.from(popularTracksButton)
            .setStyle(customIdEqualsAllTrack ? ButtonStyle.Secondary : ButtonStyle.Primary)
            .setDisabled(true)
          const secondButton = ButtonBuilder.from(allTracksButton)
            .setStyle(customIdEqualsAllTrack ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(true)

          return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(firstButton, secondButton)
        }

        for (let i = 0; i < users.length; i++) {
          const result = users[i];

          const data = {
            label: result.username,
            description: `${result.followers_count ? result.followers_count.toLocaleString('vi') : 'Không có'} người theo dõi.`,
            value: i.toString(),
            emoji: scVerified?.identifier
          }

          if (result.verified === false) delete data.emoji;

          selectMenu.addOptions(data)
        }

        const message = await interaction.editReply({
          content: `Chọn người dùng bạn cần tìm kiếm ở dưới.`,
          components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
              .addComponents(selectMenu),
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(cancelButton)
          ]
        })

        const cancelButtonCollector = message.createMessageComponentCollector({
          filter: i => i.user.id === user.id && i.customId === cancelButtonId,
          time: 60000,
          max: 1,
          componentType: ComponentType.Button,
        })

        const selectMenuCollector = message.createMessageComponentCollector({
          filter: i => i.user.id === user.id && i.customId !== cancelButtonId,
          time: 60000,
        })

        let embed: EmbedBuilder;
        let scUser: SoundcloudUserV2;
        let userSongs: SoundcloudTrackV2[] | undefined;
        let customId: string = '';

        selectMenuCollector
          .on('collect', async i => {
            await i.deferUpdate();
            if (i.isStringSelectMenu() && i.customId === selectMenuId) {
              const values = i.values;

              if (!values.length) {
                await message.edit({
                  components: [],
                  content: `Không có người dùng nào được chọn.`
                })

                return;
              }

              const index = parseInt(values[0]);
              scUser = users[index];
              scUser.avatar_url = scUser.avatar_url.replace('large', 't500x500');

              embed = new EmbedBuilder()
                .setColor(constants.embed.color)
                .setThumbnail(scUser.avatar_url)
                .setTitle(`${scUser.username}  ${scUser.verified ? scVerified : ''}`)
                .setURL(scUser.permalink_url)
                .setDescription(`${scUser.description || 'Không có mô tả.'}`)

              if (scUser.city || scUser.country_code) {
                embed.setAuthor({
                  name: `${scUser.city || ''}${scUser.city && scUser.country_code ? ', ' : ''}${scUser.country_code || ''}`,
                })
              }

              const changedEmbed = EmbedBuilder.from(embed);

              userSongs = await getUserTracks(scUser.permalink_url);
              if (userSongs && userSongs.length) {
                customId === popularTracksButtonId;
                changedEmbed.addFields(
                  {
                    name: '\u200B',
                    value: customId === allTracksButtonId ? '**Tất cả bài hát**' : '**Những bài hát phổ biến**'
                  }
                )
                const songs = userSongs.map(song => song);
                const popularSongs = songs.sort((a, b) => b.likes_count - a.likes_count);

                for (let i = 0; i < (popularSongs.length > 8 ? 8 : popularSongs.length); i++) {
                  const track = popularSongs[i];

                  const position = (i + 1).toLocaleString('vi');
                  const title = track.title;
                  const author = track.user.username;
                  const duration = formatDuration(track.duration / 1000);

                  changedEmbed.addFields(
                    {
                      name: '\u200B',
                      value: position,
                      inline: true,
                    },
                    {
                      name: title,
                      value: author,
                      inline: true,
                    },
                    {
                      name: '\u200B',
                      value: duration,
                      inline: true,
                    }
                  )
                }
              } else {
                changedEmbed.addFields(
                  {
                    name: '\u200B',
                    value: 'Không có bài hát.'
                  }
                )
              }

              await interaction.editReply({
                embeds: [changedEmbed],
                components: userSongs && userSongs.length ? [
                  generateActionRow(customId)
                ] : [],
                content: ''
              })

              return;
            } else if (i.isButton()) {
              if (i.customId === allTracksButtonId) {
                customId = allTracksButtonId;
                const changedEmbed = EmbedBuilder.from(embed);

                changedEmbed.addFields(
                  {
                    name: '\u200B',
                    value: '**Tất cả bài hát**'
                  }
                )

                const songs = userSongs!.map(song => song);

                for (let i = 0; i < (songs.length > 8 ? 8 : songs.length); i++) {
                  const track = songs[i];

                  const position = (i + 1).toLocaleString('vi');
                  const title = track.title;
                  const author = track.user.username;
                  const duration = formatDuration(track.duration / 1000);

                  changedEmbed.addFields(
                    {
                      name: '\u200B',
                      value: position,
                      inline: true,
                    },
                    {
                      name: title,
                      value: author,
                      inline: true,
                    },
                    {
                      name: '\u200B',
                      value: duration,
                      inline: true,
                    }
                  )
                }

                await interaction.editReply({
                  content: '',
                  embeds: [changedEmbed],
                  components: [
                    generateActionRow(allTracksButtonId)
                  ]
                })
              } else if (i.customId === popularTracksButtonId) {
                customId = popularTracksButtonId;
                const changedEmbed = EmbedBuilder.from(embed);

                changedEmbed.addFields(
                  {
                    name: '\u200B',
                    value: '**Những bài hát phổ biến**'
                  }
                )

                const songs = userSongs!.map(song => song);
                const popularSongs = songs.sort((a, b) => b.likes_count - a.likes_count);

                for (let i = 0; i < (popularSongs.length > 8 ? 8 : popularSongs.length); i++) {
                  const track = popularSongs[i];

                  const position = (i + 1).toLocaleString('vi');
                  const title = track.title;
                  const author = track.user.username;
                  const duration = formatDuration(track.duration / 1000);

                  changedEmbed.addFields(
                    {
                      name: '\u200B',
                      value: position,
                      inline: true,
                    },
                    {
                      name: title,
                      value: author,
                      inline: true,
                    },
                    {
                      name: '\u200B',
                      value: duration,
                      inline: true,
                    }
                  )
                }

                await interaction.editReply({
                  content: '',
                  embeds: [changedEmbed],
                  components: [
                    generateActionRow(popularTracksButtonId)
                  ]
                })
              }
            }
          })
          .on('end', async collected => {
            if (!collected.first()) {
              await interaction.editReply({
                content: 'Không có người dùng nào được chọn.',
                components: [],
                embeds: []
              })

              return;
            } else {
              await interaction.editReply({
                components: userSongs && userSongs.length ? [
                  generateActionRowDisabled(customId)
                ] : [],
                content: '',
              })
            }
          })

        cancelButtonCollector.on('end', async collected => {
          const first = collected.first();

          if (!first) return;

          await first.deferUpdate();

          selectMenuCollector.stop('Cancelled')
        })
      }
    })
  }
}