import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class Pop extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'pop',
        description: 'Bật/tắt bộ lọc pop.'
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.pop === true) player.pop = false;
        else player.pop = true;

        return await interaction.reply({
          content: `Đã ${player.pop === true ? 'bật' : 'tắt'} bộ lọc pop.`
        })
      }
    })
  }
}