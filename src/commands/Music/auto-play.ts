import { CommandTemplate } from "icytea-command-handler";
import { doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel } from "../../checks";
import TrackFeature from "../../features/track";

export default class Autoplay extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'auto-play',
        nameLocalizations: {
          vi: 'tự-động-phát'
        },
        description: "Tự động phát các bài hát liên quan.",
      },
      checks: [doesUserHaveBasicPremium, isPlayerAvailable, isUserInVoiceChannel],
      callback: async ({
        interaction,
        user,
        guild,
        member,
        channel,
        client
      }) => {
        const autoplay = TrackFeature.shared.autoplays.get(guild.id);

        const boolean = typeof autoplay === 'undefined' || autoplay === false;

        TrackFeature.shared.setAutoplay(guild.id, boolean ? true : false);

        return await interaction.reply({
          content: boolean ? `Đã bật tự động phát.` : `Đã tắt tự động phát.`
        })
      }
    })
  }
}