import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { isPlayerAvailable, isUserInVoiceChannel } from "../../checks";

export default class Pause extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'pause',
        nameLocalizations: {
          vi: 'dừng'
        },
        description: "Để dừng bài hát."
      },
      checks: [isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction, guild
      }) => {
        const player = erela.players.get(guild.id)!

        if (player.paused) {
          return await interaction.reply({
            content: `Máy phát nhạc đã dừng rồi.`,
            ephemeral: true,
          })
        }

        player.pause(true)

        return await interaction.reply({
          content: `Đã dừng máy phát nhạc.`
        })
      }
    })
  }
}