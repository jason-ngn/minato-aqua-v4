import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable } from '../../checks'
import erela from "../..";

export default class ResetFilter extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'reset',
        description: 'Đặt lại bộ lọc của máy phát nhạc.'
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        player.reset()

        return await interaction.reply({
          content: `Đã đặt lại bộ lọc của máy phát nhạc thành công.`
        })
      }
    })
  }
}