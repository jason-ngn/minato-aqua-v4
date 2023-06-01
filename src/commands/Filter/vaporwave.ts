import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class Vaporwave extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'vaporwave',
        description: 'Bật/tắt bộ lọc vaporwave.'
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.vaporwave === true) {
          player.vaporwave = false;
        } else {
          player.vaporwave = true;
        }

        return await interaction.reply({
          content: `Đã ${player.vaporwave === true ? 'bật' : 'tắt'} bộ lọc vaporwave.`
        })
      }
    })
  }
}