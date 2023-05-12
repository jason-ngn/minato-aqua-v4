import { Track } from "erela.js";
import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import TrackFeature from '../../features/track';

export default class Skip extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'skip',
        nameLocalizations: {
          vi: 'bỏ-qua'
        },
        description: "Bỏ qua bài hát đang phát."
      },
      checks: [isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        client,
        guild,
        member,
        user,
        options,
        channel,
      }) => {
        const player = erela.players.get(guild.id)!;
        const autoplay = TrackFeature.shared.autoplays.get(guild.id);

        if (player.queue.length <= 0 && (typeof autoplay === 'undefined' || autoplay === false)) {
          return await interaction.reply({
            content: `Không có bài hát nào trong hàng đợi.`,
            ephemeral: true,
          })
        }

        const song = player.queue.current! as Track;

        player.stop();

        return await interaction.reply({
          content: `Đã bỏ qua [${song.title}](<${song.uri}>).`,
        })
      }
    })
  }
}