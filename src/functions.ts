import Soundcloud, { SoundcloudTrackV2, SoundcloudUserSearchV2, SoundcloudUserV2 } from "soundcloud.ts";
import { ActionRowBuilder, ApplicationCommand, ButtonBuilder, ButtonStyle, Client, CommandInteraction, ComponentType, ContextMenuCommandInteraction, EmbedBuilder, Guild, Message, TextChannel, User } from "discord.js";
import emoji from './emoji';
import PingSC from "./features/ping-soundcloud";
import erela from ".";
import { Track } from "erela.js";
import { readdirSync } from "fs";
import path from "path";
import { CommandTemplate } from "icytea-command-handler";

const sc = new Soundcloud();

export const formatInt = (int: number) => (int < 10 ? `0${int}` : int);

export const formatDuration = (sec: number) => {
  if (!sec || !Number(sec)) return "00:00";
  const seconds = Math.round(sec % 60);
  const minutes = Math.floor((sec % 3600) / 60);
  const hours = Math.floor(sec / 3600);
  if (hours > 0)
    return `${formatInt(hours)}:${formatInt(minutes)}:${formatInt(seconds)}`;
  if (minutes > 0) return `${formatInt(minutes)}:${formatInt(seconds)}`;
  return `00:${formatInt(seconds)}`;
};

export const getThumbnail = async (songURL: string) => {
  let res: SoundcloudTrackV2;

  if (!PingSC.shared.pageAvailable) {
    return undefined;
  }

  try {
    res = await sc.tracks.getV2(songURL);
  } catch (e) {
    console.log(e);
    return;
  }

  if (res) {
    const url = res.artwork_url.replace('large', 't500x500');
    return url;
  }
  else return undefined;
}

export const searchUser = async (query: string) => {
  let res: SoundcloudUserSearchV2 | SoundcloudUserV2;

  if (!PingSC.shared.pageAvailable) return undefined;

  if (isSoundcloudURL(query)) {
    try {
      res = await sc.users.getV2(query)
    } catch (e) {
      console.log(e);
      return;
    }

    return res;
  }

  try {
    res = await sc.users.searchV2({
      q: query,
    })
  } catch (e) {
    console.log(e);
    return;
  }
  return res;
}

export const getUserTracks = async (userURL: string) => {
  let res: SoundcloudTrackV2[];

  if (!PingSC.shared.pageAvailable) return undefined;

  try {
    res = await sc.users.tracksV2(userURL)
  } catch (e) {
    console.log(e);
    return;
  }

  if (res) {
    return res;
  }
  return undefined;
}

export function getAllGroups(dir: string) {
  const groups = readdirSync(dir);

  return groups;
}

export function getCommandsInGroup(dir: string): CommandTemplate[] {
  const commands = readdirSync(dir);

  return commands.map(cmd => {
    const { default: command } = require(path.join(dir, cmd)) as { default: any };
    const c = new command();
    return c;
  })
}

export async function getTrackInfo(songURL: string) {
  let res: SoundcloudTrackV2;

  if (!PingSC.shared.pageAvailable) return;

  try {
    res = await sc.tracks.getV2(songURL);
  } catch (e) {
    console.log(e);
    return;
  }

  console.log(res.genre, res.media.transcodings, res.user, res.waveform_url);
}

export const getRelatedTracks = async (songURL: string, requester: User) => {
  let res: SoundcloudTrackV2[];

  if (!PingSC.shared.pageAvailable) return undefined;

  try {
    res = await sc.tracks.relatedV2(songURL)
  } catch (e) {
    console.log(e);
    return;
  }

  if (res) {
    const promises = res
      .filter(track => track.sharing === 'public')
      .map(async track => {
        const result = await erela.search({
          query: track.permalink_url,
          source: 'soundcloud'
        }, requester);

        if (result.loadType === 'LOAD_FAILED' || result.loadType === 'NO_MATCHES') return;

        if (
          result &&
          ["TRACK_LOADED", "SEARCH_RESULT"].includes(result.loadType) &&
          result.tracks.length &&
          result.tracks[0]
        ) {
          return result.tracks[0];
        } else return;
      }) as Promise<Track>[];

    const tracks = await Promise.all(promises);
    return tracks;
  }

  return undefined;
}

const backId = "back";
const forwardId = "forward";
const deleteId = "delete";

export async function pagination(message: Message, generateEmbed: (start: number) => Promise<EmbedBuilder>, canFitOnOnePage: boolean, array: any[], interaction: CommandInteraction | ContextMenuCommandInteraction, client: Client, numberInOnePage: number) {
  const backButton = new ButtonBuilder()
    .setCustomId(backId)
    .setEmoji(client.emojis.cache.get(emoji.back)!.identifier)
    .setStyle(ButtonStyle.Primary)

  const forwardButton = new ButtonBuilder()
    .setCustomId(forwardId)
    .setEmoji(client.emojis.cache.get(emoji.forward)!.identifier)
    .setStyle(ButtonStyle.Primary)

  const deleteButton = new ButtonBuilder()
    .setCustomId(deleteId)
    .setEmoji(client.emojis.cache.get(emoji.trashCan)!.identifier)
    .setStyle(ButtonStyle.Secondary)

  if (interaction) {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        embeds: [await generateEmbed(0)],
        components: canFitOnOnePage ? [] : [
          new ActionRowBuilder<ButtonBuilder>({
            components: [
              backButton.setDisabled(true),
              deleteButton,
              forwardButton,
            ]
          })
        ]
      });
    } else {
      await interaction.reply({
        embeds: [await generateEmbed(0)],
        components: canFitOnOnePage ? [] : [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            backButton.setDisabled(true),
            deleteButton,
            forwardButton
          )
        ]
      });
    }
  } else if (message) {
    await (message.channel as TextChannel).send({
      embeds: [await generateEmbed(0)],
      components: canFitOnOnePage ? [] : [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          backButton.setDisabled(true),
          deleteButton,
          forwardButton,
        )
      ]
    });
  }

  if (canFitOnOnePage) return;

  const collector = message.createMessageComponentCollector({
    // @ts-ignore
    filter: i => i.user.id === interaction ? interaction.user.id : message.author.id,
    time: 60000,
    componentType: ComponentType.Button
  })

  let currentIndex = 0;

  collector.on('collect', async i => {
    await i.deferUpdate();

    if (i.customId === deleteId) {
      collector.stop();
      return;
    }

    i.customId === backId ? (currentIndex -= numberInOnePage) : (currentIndex += numberInOnePage);

    await message.edit({
      embeds: [await generateEmbed(currentIndex)],
      components: [
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            ...(currentIndex ? [ButtonBuilder.from(backButton).setDisabled(false)] : [ButtonBuilder.from(backButton).setDisabled(true)]),
            ButtonBuilder.from(deleteButton),
            ...(currentIndex + numberInOnePage < array.length ? [ButtonBuilder.from(forwardButton).setDisabled(false)] : [ButtonBuilder.from(forwardButton).setDisabled(true)]),
          )
      ]
    })
  })

  collector.on('end', async () => {
    await message.edit({
      components: [
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            ButtonBuilder.from(backButton).setDisabled(true),
            ButtonBuilder.from(deleteButton).setDisabled(true),
            ButtonBuilder.from(forwardButton).setDisabled(true)
          )
      ]
    })
  })
}

export function isSoundcloudURL(url: string): boolean {
  const regex = /^(?:https?:\/\/)((?:www\.)|(?:m\.))?soundcloud\.com\/[a-z0-9](?!.*?(-|_){2})[\w-]{1,23}[a-z0-9](?:\/.+)?$/gm
  const matches = url.match(regex);

  if (matches) return true;
  else return false;
}

export function getMetadataOfCommand(command: string, instance: Guild | Client): ApplicationCommand<{}> {
  if (instance instanceof Client)
    return instance.application!.commands.cache.find(cmd => cmd.name === command)!;
  else
    return instance.commands.cache.find(cmd => cmd.name === command)!;
}

export function getSlashCommandMention(commandId: string, commandName: string): string {
  return `</${commandName}:${commandId}>`;
}