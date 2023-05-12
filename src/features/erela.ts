import { Client } from "discord.js";
import { FeatureTemplate } from "icytea-command-handler";
import erela from "..";

export default class ErelaFeature extends FeatureTemplate {
  public static readonly shared = new ErelaFeature();

  public async init(client: Client<boolean>): Promise<void> {
    erela
      .on('nodeConnect', (node) => console.log(`Connected to node ${node.options.host}`))
      .on('nodeDisconnect', (node) => console.log(`Disconnected to node ${node.options.host}`))
      .on('nodeError', (node, error) => console.log(`Node ${node.options.host} has error:`, error))
      .on('nodeReconnect', (node) => console.log(`Reconnecting to node ${node.options.host}`))
      .on('socketClosed', (player, payload) => {
        console.log(payload);
      })
      .on('trackError', (player, track, payload) => {
        console.log(`Song ${track.title} has error`, payload)
      })
      .on('trackStuck', (player, track, payload) => {
        console.log(`Song ${track.title} is stuck`, payload)
      })
  }
}