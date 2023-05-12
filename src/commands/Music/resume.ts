import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { isPlayerAvailable, isUserInVoiceChannel } from "../../checks";

export default class Resume extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'resume',
        nameLocalizations: {
          vi: 'tiếp-tục'
        },
        description: 'Tiếp tục phát nhạc.'
      },
      checks: [isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction, guild
      }) => {
        const player = erela.get(guild.id)!;

        if (!player.paused) {
          return await interaction.reply({
            content: `Máy phát nhạc chưa được dừng.`,
            ephemeral: true,
          })
        }

        player.pause(false)

        return await interaction.reply({
          content: `Đã tiếp tục phát nhạc.`
        })
      }
    })
  }
}