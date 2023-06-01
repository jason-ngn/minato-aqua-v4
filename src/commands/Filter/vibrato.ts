import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class Vibrato extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'vibrato',
        description: "Bật/tắt bộ lọc vibrato"
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.vibrato === true) player.vibrato = false;
        else player.vibrato = true;

        return await interaction.reply({
          content: `Đã ${player.vibrato === true ? 'bật' : 'tắt'} bộ lọc vibrato.`
        })
      }
    })
  }
}