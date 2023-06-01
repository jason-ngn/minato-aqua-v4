import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import erela from "../..";

export default class Karaoke extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'karaoke',
        description: 'Bật/tắt bộ lọc karaoke.'
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild
      }) => {
        const player = erela.players.get(guild.id)! as any;

        if (player.karaoke === true) player.karaoke = false;
        else player.karaoke = true;

        return await interaction.reply({
          content: `Đã ${player.karaoke === true ? 'bật' : 'tắt'} bộ lọc karaoke.`
        })
      }
    })
  }
}