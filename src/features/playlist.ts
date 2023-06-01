import { Client, Snowflake } from "discord.js";
import { Track } from "erela.js";
import { FeatureTemplate } from "icytea-command-handler";
import erela from "..";
import Playlists from '../models/Playlists'
import Premium from "./premium";

export default class Playlist extends FeatureTemplate {
  public static readonly shared = new Playlist();

  public async init(client: Client<boolean>): Promise<void> { }

  public async getPlaylists(client: Client, userId: string): Promise<{
    name: string;
    tracks: Track[]
  }[] | undefined> {
    const playlists = Playlists.shared.get({ userId });

    if (!playlists || !playlists.playlists.length) return undefined;

    const array: {
      name: string,
      tracks: Track[]
    }[] = [];
    for (const playlist of playlists.playlists) {
      const songs = playlist.tracks.map(async songUrl => {
        const results = await erela.search({
          query: songUrl,
          source: 'soundcloud',
        }, client.users.cache.get(userId)!);

        if (results && results.tracks[0]) {
          return results.tracks[0]
        };
      })

      const promises = (await Promise.all(songs)).filter(track => typeof track !== 'undefined')

      array.push({
        name: playlist.name,
        tracks: promises as Track[]
      })
    }

    return array;
  }

  public async getSpecificPlaylist(client: Client, userId: Snowflake, playlistName: string): Promise<{
    name: string;
    tracks: Track[]
  } | undefined> {
    const playlists = Playlists.shared.get({ userId });

    if (!playlists) return undefined;

    const playlist = playlists.playlists.find(pl => pl.name === playlistName);

    if (!playlist) return undefined;

    const songs = playlist.tracks.map(async songUrl => {
      const results = await erela.search({
        query: songUrl,
        source: 'soundcloud'
      }, client.users.cache.get(userId)!)

      if (results && results.tracks[0]) {
        return results.tracks[0];
      }
    });

    const promises = (await Promise.all(songs)).filter(track => typeof track !== 'undefined')
    return {
      name: playlist.name,
      tracks: promises as Track[],
    }
  }

  public async createPlaylist(client: Client, userId: Snowflake, playlistName: string): Promise<{
    name: string;
    tracks: Track[]
  }> {
    const playlist = Playlists.shared.get({ userId });

    if (playlist) {
      const specificPlaylist = playlist.playlists.find(pl => pl.name === playlistName);
      if (specificPlaylist) {
        const songs = specificPlaylist.tracks.map(async songUrl => {
          const results = await erela.search({
            query: songUrl,
            source: 'soundcloud'
          }, client.users.cache.get(userId)!)

          if (results && results.tracks[0]) {
            return results.tracks[0];
          }
        })

        const promises = (await Promise.all(songs)).filter(track => typeof track !== 'undefined')

        return {
          name: playlistName,
          tracks: promises as Track[],
        }
      } else {
        const data = {
          userId,
          playlists: [
            ...playlist.playlists,
            {
              name: playlistName,
              tracks: []
            }
          ]
        }

        await Playlists.shared.update({
          userId,
        }, data)

        return {
          name: playlistName,
          tracks: []
        }
      }
    }

    const data = {
      userId,
      playlists: [
        {
          name: playlistName,
          tracks: []
        }
      ]
    }

    await Playlists.shared.update({
      userId,
    }, data)

    return {
      name: playlistName,
      tracks: []
    }
  }

  public async updatePlaylist(userId: string, playlistName: string, songUrl: string, action: 'remove' | 'add'): Promise<boolean> {
    const playlists = Playlists.shared.get({ userId })
    // TODO: Fix this function
    if (!playlists || !playlists.playlists) return false;
    const playlist = playlists.playlists.find(pl => pl.name === playlistName);
    if (!playlist) return false;
    const index = playlists.playlists.indexOf(playlist)

    if (action === 'add') {
      const newTracks = [...playlist.tracks, songUrl];
      playlist.tracks = newTracks;

      playlists.playlists[index] = playlist

      await Playlists.shared.update({ userId: userId }, { userId: userId, playlists: playlists.playlists })
    } else if (action === 'remove') {
      const indexOfSong = playlist.tracks.indexOf(songUrl);
      playlist.tracks.splice(indexOfSong, 1);

      playlists.playlists[index] = playlist

      await Playlists.shared.update({ userId: userId }, { userId: userId, playlists: playlists.playlists })
    }

    return true;
  }

  public async deletePlaylist(userId: string, playlistName: string): Promise<boolean> {
    const playlists = Playlists.shared.get({ userId })

    if (!playlists) return false;

    const specificPlaylist = playlists.playlists.find(pl => pl.name === playlistName);
    if (!specificPlaylist) return false;

    playlists.playlists.splice(playlists.playlists.indexOf(specificPlaylist), 1);

    await Playlists.shared.update({ userId }, { userId, playlists: playlists.playlists });

    return true;
  }

  public async bulkDeletePlaylists(userId: string): Promise<boolean> {
    const playlists = Playlists.shared.get({ userId })

    if (!playlists) return false;

    await Playlists.shared.delete({ userId })

    return true;
  }
}