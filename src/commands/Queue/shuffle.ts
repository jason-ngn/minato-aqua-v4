import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";

export default class Shuffle extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'shuffle',
        nameLocalizations: {
          vi: 'xáo-trộn'
        },
        description: "Xáo trộn vị trí của các bài hát ở trong hàng đợi.",
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        client,
        guild,
        member,
        user
      }) => {
        const player = erela.players.get(guild.id)!;

        if (!player.queue.length) {
          return await interaction.reply({
            ephemeral: true,
            content: `Không có bài hát nào trong hàng đợi.`,
          })
        }

        player.queue.shuffle();

        return await interaction.reply({
          content: `Đã xoá trộn hàng đợi.`
        })
      }
    })
  }
}