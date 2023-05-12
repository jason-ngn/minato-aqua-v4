import { Client } from "discord.js";
import { FeatureTemplate } from "icytea-command-handler";
import erela from "..";
import TrackFeature, { collectorCache, messageCache, resetTrackCache } from "./track";

export default class PlayerFeature extends FeatureTemplate {
  public static readonly shared = new PlayerFeature();

  public async init(client: Client<boolean>): Promise<void> {
    erela
      .on('queueEnd', async (player) => {
        const autoplay = TrackFeature.shared.autoplays.get(player.guild);

        if (autoplay && autoplay === true) {
          await TrackFeature.shared.autoplay(client, player);
          return;
        }

        try {
          player.destroy();
        } catch { }
      })
      .on('playerDestroy', async (player) => {
        try {
          const guild = client.guilds.cache.get(player.guild);
          if (!guild) return;

          const collector = collectorCache.get(guild.id);
          if (!collector) return;

          resetTrackCache(player.guild);
          collector.stop();

          const message = messageCache.get(player.guild);
          if (!message) return;

          try {
            if (message.deletable) await message.delete();
          } catch (e) {
            console.log(e);
          }
        } catch { }
      })
  }
}