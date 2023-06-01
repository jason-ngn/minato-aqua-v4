import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class Tremolo extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'tremolo',
        description: "Bật/tắt bộ lọc tremolo."
      },
      checks: [doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.tremolo === true) player.tremolo = false;
        else player.tremolo = true;

        return await interaction.reply({
          content: `Đã ${player.tremolo === true ? 'bật' : 'tắt'} bộ lọc tremolo.`
        })
      }
    })
  }
}
