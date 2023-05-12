import { EmbedBuilder } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { isPlayerAvailable } from "../../checks";
import constants from "../../constants";
import { formatDuration, getThumbnail } from "../../functions";

export default class NowPlaying extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'now-playing',
        nameLocalizations: {
          vi: 'đang-phát'
        },
        description: "Xem bài hát đang phát hiện tại."
      },
      checks: [isPlayerAvailable],
      callback: async ({
        interaction,
        guild,
      }) => {
        await interaction.deferReply();

        const player = erela.players.get(guild.id)!;

        const currentTrack = player?.queue.current;

        if (!currentTrack) {
          return await interaction.editReply({
            content: `Không có bài hát nào đang phát.`,
          })
        }
        const trackDuration = formatDuration(currentTrack.duration! / 1000);
        const playerDuration = formatDuration(player.position / 1000);

        const embed = new EmbedBuilder()
          .setTitle(`Đang phát`)
          .setColor(constants.embed.color)
          .setDescription(`[${currentTrack.title}](${currentTrack.uri})\nbởi **${currentTrack.author}**\n\n${playerDuration} / ${trackDuration}`)

        const thumbnail = await getThumbnail(currentTrack.uri!)

        if (thumbnail) embed.setThumbnail(thumbnail);

        await interaction.editReply({
          embeds: [embed]
        })
      }
    })
  }
}