import { ApplicationCommandOptionType } from "discord.js";
import { Track } from "erela.js";
import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";

export default class Jump extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'jump',
        nameLocalizations: {
          vi: 'nhảy'
        },
        description: "Để nhảy tới 1 bài hát ở trong hàng đợi.",
        options: [
          {
            name: 'position',
            nameLocalizations: {
              vi: 'vị-trí'
            },
            description: "Vị trí của bài hát.",
            type: ApplicationCommandOptionType.Number,
            required: true,
            autocomplete: true,
          }
        ]
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      autocompleteFunction: async (interaction, focusedArg, handler) => {
        const player = erela.players.get(interaction.guild!.id);
        if (!player || !player.queue.length) return;

        if (!focusedArg.value.length) {
          return player.queue.map((track, i) => ({
            name: `${(i + 1).toLocaleString('vi')} - ${track.title}`,
            value: i + 1,
          }))
        }

        const specificSongs = player.queue.filter((_, i) => parseInt(focusedArg.value) === i);
        if (!specificSongs || !specificSongs.length) return;

        return specificSongs.map((track, i) => ({
          name: `${(i + 1).toLocaleString('vi')} - ${track.title}`,
          value: i + 1,
        }))
      },
      callback: async ({
        interaction,
        client,
        guild,
        member,
        user,
        options
      }) => {
        await interaction.deferReply();
        const position = options.getNumber('position', true);
        const player = erela.players.get(guild.id)!;
        if (!player.queue[position]) {
          return await interaction.editReply({
            content: `Bài hát này không tồn tại trong hàng đợi.`
          })
        }

        player.stop(position);

        return await interaction.editReply({
          content: `Đã bỏ qua **${(position - 1 === 0 ? position : position - 1).toLocaleString('vi')}** bài hát.`
        })
      }
    })
  }
}