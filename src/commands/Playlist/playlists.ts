import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, Message, StringSelectMenuBuilder } from "discord.js";
import { Track } from "erela.js";
import { CallbackObject, CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import constants from "../../constants";
import emoji from "../../emoji";
import PlaylistFeature from '../../features/playlist'
import { formatDuration } from "../../functions";
import PlaylistsModel from "../../models/Playlists";
import { } from '../../checks'

const selectMenuId = 'select-menu';
const backId = "back";
const forwardId = "forward";
const deleteId = "delete";
const addSelectMenuId = 'add-select-menu';
const cancelButtonId = 'cancel';

const viewCommand = async ({ client, interaction, user }: CallbackObject, message: Message<boolean>): Promise<any> => {
  const playlists = await PlaylistFeature.shared.getPlaylists(client, user.id);

  if (!playlists) {
    return await interaction.editReply({
      content: `Bạn không có danh sách phát nào cả.`
    })
  }

  const embed = new EmbedBuilder()
    .setColor(constants.embed.color)
    .setAuthor({
      name: `Các danh sách phát của ${user.username}`
    })
    .setDescription(playlists.map(pl => `${pl.name} - **${pl.tracks.length.toLocaleString()}** bài hát`).join('\n'))

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(selectMenuId)
    .setPlaceholder(`Chọn danh sách phát của bạn ở đây.`)
    .setMaxValues(1)

  const backButton = new ButtonBuilder()
    .setCustomId(backId)
    .setEmoji(client.emojis.cache.get(emoji.back)!.identifier)
    .setStyle(ButtonStyle.Primary)

  const forwardButton = new ButtonBuilder()
    .setCustomId(forwardId)
    .setEmoji(client.emojis.cache.get(emoji.forward)!.identifier)
    .setStyle(ButtonStyle.Primary)

  const deleteButton = new ButtonBuilder()
    .setCustomId(deleteId)
    .setEmoji(client.emojis.cache.get(emoji.trashCan)!.identifier)
    .setStyle(ButtonStyle.Secondary)

  for (const playlist of playlists) {
    const totalDuration = formatDuration(playlist.tracks.reduce((prev, curr) => prev + curr.duration, 0) / 1000);

    selectMenu.addOptions({
      label: playlist.name,
      description: totalDuration,
      value: playlist.name,
    })
  }

  await interaction.editReply({
    embeds: [embed],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    ],
  })

  const collector = message.createMessageComponentCollector({
    filter: i => i.user.id === user.id,
    time: 60000,
  })

  let currentIndex = 0;
  let currentPlaylist: {
    name: string;
    tracks: Track[];
  };
  let canFitOnOnePage: boolean;

  collector
    .on('collect', async i => {
      await i.deferUpdate();

      const generateEmbed = async (start: number) => {
        const tracks = currentPlaylist.tracks.slice(start, start + 5);

        const embed = new EmbedBuilder()
          .setColor(constants.embed.color)
          .setTitle(currentPlaylist.name)

        if (tracks.length) {
          for (let index = 0; index < tracks.length; index++) {
            const track = tracks[index];
            embed.addFields(
              {
                name: '\u200B',
                value: (start + index + 1).toLocaleString(),
                inline: true,
              },
              {
                name: track.title,
                value: track.author,
                inline: true,
              },
              {
                name: '\u200B',
                value: `${formatDuration(track.duration / 1000)}`,
                inline: true,
              },
            )
          }
        } else {
          embed.setDescription(`Không có bài hát nào.`)
        }

        return embed;
      }

      if (i.isStringSelectMenu()) {
        const plName = i.values[0];
        const playlist = playlists.find(pl => pl.name === plName)!;
        currentPlaylist = playlist;

        canFitOnOnePage = playlist.tracks.length <= 5;

        await interaction.editReply({
          embeds: [await generateEmbed(currentIndex)],
          components: canFitOnOnePage ?
            [
              new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(StringSelectMenuBuilder.from(selectMenu))
            ] :
            [
              new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(StringSelectMenuBuilder.from(selectMenu)),
              new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  backButton.setDisabled(true),
                  deleteButton,
                  forwardButton
                )
            ]
        })
      } else if (i.isButton()) {
        if (i.customId === deleteId) {
          collector.stop();
          return;
        }

        i.customId === backId ? (currentIndex -= 5) : (currentIndex += 5);

        await interaction.editReply({
          embeds: [await generateEmbed(currentIndex)],
          components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
              .addComponents(StringSelectMenuBuilder.from(selectMenu)),
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                ...(
                  currentIndex ?
                    [
                      ButtonBuilder.from(backButton).setDisabled(false)
                    ] : [
                      ButtonBuilder.from(backButton).setDisabled(true)
                    ]
                ),
                ButtonBuilder.from(deleteButton),
                ...(
                  currentIndex + 5 < currentPlaylist.tracks.length ?
                    [
                      ButtonBuilder.from(forwardButton).setDisabled(false)
                    ] : [
                      ButtonBuilder.from(forwardButton).setDisabled(true)
                    ]
                )
              )
          ]
        })
      }
    })
    .on('end', async () => {
      await message.edit({
        components: canFitOnOnePage ? [
          new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
              StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
            ),
        ] : [
          new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
              StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
            ),
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              ButtonBuilder.from(backButton).setDisabled(true),
              ButtonBuilder.from(deleteButton).setDisabled(true),
              ButtonBuilder.from(forwardButton).setDisabled(true)
            )
        ]
      })
    })
}

const loadCommand = async ({ client, channel, interaction, user, options, guild, member }: CallbackObject): Promise<any> => {
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    return await interaction.editReply({
      content: `Hãy tham gia vào kênh thoại để nghe nhạc ^^!`
    })
  }

  const playlistName = options.getString('name', true);
  const playlist = await PlaylistFeature.shared.getSpecificPlaylist(client, user.id, playlistName);

  if (!playlist) {
    return await interaction.editReply({
      content: `Bạn không có danh sách phát nào có tên **${playlistName}** cả.`
    })
  }

  if (!playlist.tracks.length) {
    return await interaction.editReply({
      content: `Danh sách phát **${playlist.name}** không có bài hát nào cả.`
    })
  }

  let player = erela.players.get(guild.id);
  if (!player) {
    player = erela.create({
      voiceChannel: voiceChannel.id,
      textChannel: channel!.id,
      guild: guild.id,
      selfDeafen: true,
      selfMute: false,
    })
  }

  for (const track of playlist.tracks) {
    console.log(track)
    player.queue.add(track)
  }

  const embed = new EmbedBuilder()
    .setColor(constants.embed.color)
    .setTitle(playlist.name)
    .setDescription(`Đã thêm **${playlist.tracks.length.toLocaleString()}** bài hát vào hàng đợi.`)

  await interaction.editReply({
    embeds: [embed]
  })

  if (!player.playing && !player.paused) {
    player.connect()
    await player.play();
  }
}

const createCommand = async ({ client, channel, interaction, user, options, guild, member }: CallbackObject): Promise<any> => {
  const playlistName = options.getString('name', true);

  const existingPlaylist = await PlaylistFeature.shared.getSpecificPlaylist(client, user.id, playlistName);

  if (existingPlaylist) {
    return await interaction.editReply({
      content: `Đã có 1 danh sách phát có tên này rồi, bạn vui lòng thay bằng tên khác nhé.`
    })
  }

  await PlaylistFeature.shared.createPlaylist(client, user.id, playlistName);

  return await interaction.editReply({
    content: `Danh sách phát **${playlistName}** đã được tạo thành công.`
  })
}

const addCommand = async ({ client, channel, interaction, user, options, guild, member }: CallbackObject): Promise<any> => {
  const playlistName = options.getString('name', true);
  const query = options.getString('query', false);

  const playlist = await PlaylistFeature.shared.getSpecificPlaylist(client, user.id, playlistName);

  if (!playlist) {
    return await interaction.editReply({
      content: `Danh sách phát **${playlistName}** không tồn tại.`
    })
  }

  if (!query) {
    const player = erela.players.get(guild.id);
    if (!player) {
      return await interaction.editReply({
        content: 'Không có máy phát nhạc trong máy chủ này.'
      })
    }

    if (!player.queue.current) {
      return await interaction.editReply({
        content: `Không có bài hát nào đang phát hiện tại.`
      })
    }

    const track = player.queue.current;

    await PlaylistFeature.shared.updatePlaylist(user.id, playlist.name, track.uri!, 'add');

    await interaction.editReply({
      content: `Đã thêm [${track.title}](<${track.uri}>) vào danh sách phát **${playlist.name}**.`
    })

    return;
  }

  const results = await erela.search({
    query,
    source: 'soundcloud'
  }, user);

  if (results.loadType === 'LOAD_FAILED') {
    return await interaction.editReply({
      content: `Không thể tìm bài hát mà bạn đã yêu cầu.`
    })
  } else if (results.loadType === 'PLAYLIST_LOADED') {
    for (const track of results.tracks) {
      await PlaylistFeature.shared.updatePlaylist(user.id, playlistName, track.uri, 'add');
    }
  } else {
    if (results.tracks.length > 25) {
      results.tracks = results.tracks.slice(0, 25);
    }

    const tracks = results.tracks;

    const addSelectMenu = new StringSelectMenuBuilder()
      .setCustomId(addSelectMenuId)
      .setPlaceholder(`Chọn bài hát của bạn ở đây.`)
      .setMinValues(1)
      .setMaxValues(tracks.length)

    const cancelButton = new ButtonBuilder()
      .setCustomId(cancelButtonId)
      .setStyle(ButtonStyle.Secondary)
      .setLabel(`Huỷ tìm kiếm`)

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      const title = track.title;
      const author = track.author;
      const duration = formatDuration(track.duration / 1000);

      addSelectMenu.addOptions({
        label: title,
        value: i.toString(),
        description: `${author} - ${duration}`
      })
    }

    const message = await interaction.editReply({
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(addSelectMenu),
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(cancelButton)
      ],
      content: `Chọn bài hát của bạn ở dưới.`
    })


    const buttonCollector = message.createMessageComponentCollector({
      filter: i => i.user.id === user.id,
      time: 60000,
      max: 1,
      componentType: ComponentType.Button,
    })

    const selectMenuCollector = message.createMessageComponentCollector({
      filter: i => i.user.id === user.id,
      time: 60000,
      max: 1,
      componentType: ComponentType.StringSelect,
    })

    selectMenuCollector.on('end', async collected => {
      const first = collected.first();
      await first?.deferUpdate();

      const values = first?.values;

      if (!values?.length) {
        await message.edit({
          components: [],
          content: `Không có bài hát nào được chọn.`
        })

        return;
      }

      const tracksAdded: Track[] = [];
      for (const value of values) {
        const index = parseInt(value);
        const track = tracks[index];
        tracksAdded.push(track);
        await PlaylistFeature.shared.updatePlaylist(user.id, playlist.name, track.uri, 'add');
      }

      if (values.length === 1) {
        await message.edit({
          components: [],
          content: `Đã thêm [${tracksAdded[0].title}](<${tracksAdded[0].uri}>) vào danh sách phát **${playlist.name}**.`
        })
      } else {
        await message.edit({
          components: [],
          content: `Đã thêm **${tracksAdded.length}** bài hát vào danh sách phát **${playlist.name}**.`
        })
      }
    })

    buttonCollector.on('end', async collected => {
      const first = collected.first();
      await first?.deferUpdate();
      selectMenuCollector.stop('Cancelled')
    })
  };
}

const removeCommand = async ({ client, channel, interaction, user, options, guild, member }: CallbackObject): Promise<any> => {
  const playlistName = options.getString('name', true);
  const songPosition = options.getNumber('position', true);

  const playlist = await PlaylistFeature.shared.getSpecificPlaylist(client, user.id, playlistName);

  if (!playlist) {
    return await interaction.editReply({
      content: `Danh sách phát **${playlistName}** không tồn tại.`
    })
  }

  const song = playlist.tracks[songPosition - 1];

  if (!song) {
    return await interaction.editReply({
      content: `Bài hát này không tồn tại trong danh sách phát **${playlist.name}**.`
    })
  }

  await PlaylistFeature.shared.updatePlaylist(user.id, playlist.name, song.uri, 'remove');

  return await interaction.editReply({
    content: `Đã xoá [${song.title}](<${song.uri}>) khỏi danh sách phát **${playlist.name}**.`
  })
}

const deleteCommand = async ({ client, channel, interaction, user, options, guild, member }: CallbackObject): Promise<any> => {
  const playlistName = options.getString('name', true);
  const playlist = await PlaylistFeature.shared.getSpecificPlaylist(client, user.id, playlistName);

  if (!playlist) {
    return await interaction.editReply({
      content: `Danh sách phát **${playlistName}** không tồn tại.`
    })
  }

  await PlaylistFeature.shared.deletePlaylist(user.id, playlistName);

  return await interaction.editReply({
    content: `Đã xoá danh sách phát **${playlist.name}** thành công.`
  })
}

export default class Playlists extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'playlist',
        nameLocalizations: {
          vi: 'danh-sách-phát',
        },
        description: "Danh mục lệnh để quản lí các danh sách phát của bạn.",
        options: [
          {
            name: 'view',
            nameLocalizations: {
              vi: 'xem'
            },
            description: 'Xem tất cả các danh sách phát của bạn.',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'load',
            nameLocalizations: {
              vi: 'phát'
            },
            description: 'Phát tất cả các bài hát trong danh sách phát của bạn.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'name',
                nameLocalizations: {
                  vi: 'tên'
                },
                description: 'Tên của danh sách phát bạn muốn phát.',
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
                required: true,
              }
            ]
          },
          {
            name: 'create',
            nameLocalizations: {
              vi: 'tạo'
            },
            description: "Tạo danh sách phát mới.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'name',
                nameLocalizations: {
                  vi: 'tên'
                },
                description: 'Tên của danh sách phát.',
                type: ApplicationCommandOptionType.String,
                required: true,
              }
            ]
          },
          {
            name: 'add',
            nameLocalizations: {
              vi: 'thêm'
            },
            description: "Thêm bài hát vào danh sách phát.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'name',
                nameLocalizations: {
                  vi: "tên"
                },
                description: 'Tên danh sách phát.',
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
              },
              {
                name: 'query',
                nameLocalizations: {
                  vi: 'từ-khoá'
                },
                description: 'Từ khoá hoặc URL.',
                type: ApplicationCommandOptionType.String,
              }
            ]
          },
          {
            name: 'remove',
            nameLocalizations: {
              vi: 'xoá-bài-hát'
            },
            description: 'Xoá bài hát khỏi danh sách phát.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'name',
                nameLocalizations: {
                  vi: 'tên',
                },
                description: 'Tên danh sách phát.',
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
              },
              {
                name: 'position',
                nameLocalizations: {
                  vi: 'vị-trí'
                },
                description: 'Vị trí của bài hát.',
                required: true,
                autocomplete: true,
                type: ApplicationCommandOptionType.Number,
              }
            ]
          },
          {
            name: 'delete',
            nameLocalizations: {
              vi: 'xoá',
            },
            description: 'Xoá danh sách phát.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'name',
                nameLocalizations: {
                  vi: 'tên'
                },
                description: "Tên danh sách phát.",
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
              }
            ]
          }
        ]
      },
      autocompleteFunction: async (interaction, focusedArgument, handler) => {
        const subcommand = interaction.options.getSubcommand();

        if ((['load', 'add', 'remove', 'delete'].includes(subcommand)) && focusedArgument.name === 'name') {
          const playlists = PlaylistsModel.shared.get({ userId: interaction.user.id });
          if (!playlists || !playlists.playlists.length || playlists.playlists.some(pl => pl === null)) return;

          const playlistNames = playlists.playlists.map(pl => pl.name);
          if (!playlistNames.length) return;

          if (!focusedArgument.value.length) {
            return playlistNames.map(pl => ({
              name: pl,
              value: pl,
            }))
          }

          const specificPlaylist = playlistNames.filter(pl => pl.toLowerCase().match(new RegExp(`(${focusedArgument.value.toLowerCase()})`, 'g')));
          if (!specificPlaylist || !specificPlaylist.length) return;

          return specificPlaylist.map(pl => ({
            name: pl,
            value: pl
          }))
        } else if (subcommand === 'remove' || focusedArgument.name === 'position') {
          const playlistName = interaction.options.getString('name', true);
          const playlist = (await PlaylistFeature.shared.getSpecificPlaylist(handler.client, interaction.user.id, playlistName))!;

          if (!playlist.tracks || !playlist.tracks.length) return;

          if (!focusedArgument.value.length) {
            const res = playlist.tracks.map((track, i) => ({
              name: `${(i + 1).toLocaleString('vi')} - ${track.title}`,
              value: i + 1,
            }))

            return res
          }

          const specificSongs = playlist.tracks.filter((_, i) => parseInt(focusedArgument.value) === i);
          if (!specificSongs || !specificSongs.length) return;

          return specificSongs.map((song, i) => ({
            name: `${(i + 1).toLocaleString('vi')} - ${song.title}`,
            value: i + 1
          }))
        }
      },
      callback: async (obj) => {
        const message = await obj.interaction.deferReply({
          fetchReply: true,
        });

        const subcommand = obj.options.getSubcommand();

        switch (subcommand) {
          case 'view':
            await viewCommand(obj, message);
            break;
          case 'load':
            await loadCommand(obj);
            break;
          case 'create':
            await createCommand(obj);
            break;
          case 'add':
            await addCommand(obj);
            break;
          case 'remove':
            await removeCommand(obj);
            break;
          case 'delete':
            await deleteCommand(obj);
            break;
        }
      }
    })
  }
}