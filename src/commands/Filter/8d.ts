import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class EightD extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: '8d',
        description: 'Bật/tắt bộ lọc 8D.'
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.eightD === true) player.eightD = false;
        else player.eightD = true;

        return await interaction.reply({
          content: `Đã ${player.eightD === true ? 'bật' : 'tắt'} bộ lọc 8D`
        })
      }
    })
  }
}