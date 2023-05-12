import { ApplicationCommandOptionType } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { isPlayerAvailable, isUserInVoiceChannel } from "../../checks";

export default class Loop extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'loop',
        nameLocalizations: {
          vi: 'lặp'
        },
        description: "Cài đặt chế độ lặp cho máy phát.",
        options: [
          {
            name: 'song',
            nameLocalizations: {
              vi: 'bài-hát'
            },
            description: "Lặp lại bài hát.",
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'queue',
            nameLocalizations: {
              vi: 'hàng-đợi'
            },
            description: "Lặp lại hàng đợi.",
            type: ApplicationCommandOptionType.Subcommand
          },
          {
            name: 'reset',
            nameLocalizations: {
              vi: 'đặt-lại'
            },
            description: "Tắt chế độ lặp lại.",
            type: ApplicationCommandOptionType.Subcommand
          }
        ]
      },
      checks: [isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        client,
        guild,
        member,
        user,
        options
      }) => {
        const player = erela.players.get(guild.id)!;
        const subcommand = options.getSubcommand();

        if (subcommand === 'song') {
          if (!player.queue.current) {
            return await interaction.reply({
              ephemeral: true,
              content: `Không có bài hát nào đang phát.`
            })
          }

          player.setTrackRepeat(true);

          return await interaction.reply({
            content: `Đã bật chế độ lặp lại bài hát.`
          })
        } else if (subcommand === 'queue') {
          player.setQueueRepeat(true);

          return await interaction.reply({
            content: `Đã bật chế độ lặp lại hàng đợi.`
          })
        } else if (subcommand === 'reset') {
          player.setQueueRepeat(false);
          player.setTrackRepeat(false);

          return await interaction.reply({
            content: `Đã tắt chế độ lặp lại.`
          })
        }
      }
    })
  }
}