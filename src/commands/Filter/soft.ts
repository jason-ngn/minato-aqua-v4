import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class Soft extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'soft',
        description: 'Bật/tắt bộ lọc soft.'
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.soft === true) player.soft = false;
        else player.soft = true;

        return await interaction.reply({
          content: `Đã ${player.soft === true ? 'bật' : 'tắt'} bộ lọc pop.`
        })
      }
    })
  }
}