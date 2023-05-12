import { Client } from "discord.js";
import { Manager } from "erela.js";
import constants from "./constants";

export default (client: Client) => {
  const manager = new Manager({
    nodes: constants.Nodes,
    defaultSearchPlatform: 'soundcloud',
    send(id, payload) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
  })

  return manager;
}