import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class Nightcore extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'nightcore',
        description: "Bật/tắt bộ lọc nightcore."
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        client,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.nightcore === true) {
          player.nightcore = false;
        } else {
          player.nightcore = true;
        }

        return await interaction.reply({
          content: `Đã ${player.nightcore === true ? 'bật' : 'tắt'} bộ lọc nightcore.`
        })
      }
    })
  }
}