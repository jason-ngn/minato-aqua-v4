import { ApplicationCommandOptionType } from "discord.js";
import { Player, Track } from "erela.js";
import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { isUserInVoiceChannel, isPlayerAvailable } from '../../checks'

export default class Remove extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'remove',
        nameLocalizations: {
          vi: 'xoá-bài-hát'
        },
        description: "Xoá 1 bài hát khỏi hàng đợi.",
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
      checks: [isUserInVoiceChannel, isPlayerAvailable],
      autocompleteFunction: async (interaction, focusedArg, handler) => {
        const player = erela.players.get(interaction.guild!.id);
        if (!player) return;
        if (!player.queue.length) return;

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
        options,
        handler
      }) => {
        await interaction.deferReply();

        const position = options.getNumber('position', true) - 1;

        const player = erela.players.get(guild.id)! as Player;

        if (!player.queue[position]) {
          return await interaction.editReply({
            content: `Bài hát này không tồn tại trong hàng đợi.`
          })
        }

        const removedSong = player.queue.splice(position, 1)[0] as Track

        return await interaction.editReply({
          content: `Đã xoá [${removedSong.title}](<${removedSong.uri}>) khỏi hàng đợi.`
        })
      }
    })
  }
}