import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { isPlayerAvailable, isUserInVoiceChannel } from "../../checks";

export default class Disconnect extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'stop',
        nameLocalizations: {
          vi: 'dừng',
        },
        description: "Dừng phát nhạc và ngắt kết nối khỏi kênh thoại"
      },
      checks: [isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.get(guild.id)!;

        try {
          player.destroy(true);
        } catch {
          await interaction.reply({
            content: `Đã dừng phát nhạc và ngắt kết nối.`
          })
        }

        await interaction.reply({
          content: `Đã dừng phát nhạc và ngắt kết nối.`
        })
      }
    })
  }
}