import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class TrebleBass extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'treble-bass',
        description: 'Bật/tắt bộ lọc treble bass.'
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.treblebass === true) player.treblebass = false;
        else player.treblebass = true;

        return await interaction.reply({
          content: `Đã ${player.treblebass === true ? 'bật' : 'tắt'} bộ lọc treble bass.`
        })
      }
    })
  }
}