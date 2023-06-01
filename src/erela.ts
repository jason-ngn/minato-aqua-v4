import { Client } from "discord.js";
import { Manager } from "erela.js";
import constants from "./constants";
import Filter from 'erela.js-filters'

export default (client: Client) => {
  const manager = new Manager({
    plugins: [
      new Filter()
    ],
    nodes: constants.Nodes,
    defaultSearchPlatform: 'soundcloud',
    send(id, payload) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
  })

  return manager;
}