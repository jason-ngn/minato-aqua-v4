import { EmbedBuilder } from "discord.js";
import { Track } from "erela.js";
import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { isPlayerAvailable } from '../../checks'
import constants from "../../constants";
import { formatDuration, pagination } from '../../functions'

export default class Queue extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'queue',
        nameLocalizations: {
          vi: 'hàng-đợi'
        },
        description: 'Xem hàng đợi của máy phát nhạc.',
      },
      checks: [isPlayerAvailable],
      callback: async ({
        interaction,
        client,
        options,
        channel,
        member,
        user,
        guild
      }) => {
        const message = await interaction.deferReply({
          fetchReply: true,
        });

        const player = erela.players.get(guild.id)!;

        const currentSong = player.queue.current as Track;

        const generateEmbed = async (start: number): Promise<EmbedBuilder> => {
          const tracks = player.queue.slice(start, start + 5) as Track[];

          const embed = new EmbedBuilder()
            .setColor(constants.embed.color)
            .setTitle(`Danh sách chờ`)

          embed.addFields(
            {
              name: '\u200B',
              value: '**Đang phát**'
            },
            {
              name: '\u200B',
              value: '\u200B',
              inline: true,
            },
            {
              name: currentSong.title,
              value: currentSong.author,
              inline: true,
            },
            {
              name: '\u200B',
              value: formatDuration(currentSong.duration / 1000),
              inline: true,
            },
            {
              name: '\u200B',
              value: '**Hàng đợi**'
            }
          )

          if (tracks.length <= 0) {
            embed.addFields(
              {
                name: '\u200B',
                value: 'Không có bài hát.'
              }
            )
          } else {
            for (let i = 0; i < tracks.length; i++) {
              const track = tracks[i];
              const position = start + i + 1;

              embed.addFields(
                {
                  name: '\u200B',
                  value: position.toLocaleString(),
                  inline: true,
                },
                {
                  name: track.title,
                  value: track.author,
                  inline: true,
                },
                {
                  name: '\u200B',
                  value: formatDuration(track.duration / 1000),
                  inline: true,
                }
              )
            }
          }

          return embed;
        }

        const canFitOnOnePage = player.queue.length <= 5;

        return await pagination(message, generateEmbed, canFitOnOnePage, player.queue, interaction, client, 5);
      }
    })
  }
}