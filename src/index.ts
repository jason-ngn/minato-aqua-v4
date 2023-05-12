import { Client } from "discord.js";
import { CommandHandler } from "icytea-command-handler";
import { DatabaseHandler } from "mongo-database-handler";
import path from "path";
import Constants from './constants'
import erelaFunc from './erela'
import Backend from "./backend";

const client = new Client({
  intents: 32767,
})

const erela = erelaFunc(client)

client.on('ready', async () => {
  if (Constants.Beta) {
    console.log(`Beta mode enabled.`)
  } else console.log(`Production mode enabled.`)

  erela.init(client.user?.id);

  const backend = new Backend(client, 3000)
  await new DatabaseHandler(Constants.MongoURL).init(path.join(__dirname, 'models'))
  await new CommandHandler(client, {
    commandsDir: path.join(__dirname, 'commands'),
    featuresDir: path.join(__dirname, 'features'),
    testServers: Constants.TestServers,
    testOnly: Constants.Beta,
    owners: Constants.owners
  }).init()

  console.log(`Logged in as ${client.user?.tag}.`)
})

client.on('raw', (d) => erela.updateVoiceState(d));

client.login(Constants.Beta ? Constants.BetaToken : Constants.Token);
export default erela;