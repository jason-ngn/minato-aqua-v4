import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class Bassboost extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'bassboost',
        description: 'Bật/tắt bộ lọc bassboost'
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.bassboost === true) {
          player.bassboost = false;
        } else player.bassboost = true;

        return await interaction.reply({
          content: `Đã ${player.bassboost === true ? 'bật' : 'tắt'} bộ lọc bassboost.`
        })
      }
    })
  }
}