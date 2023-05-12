import { CallbackObject, CheckReturnObject } from "icytea-command-handler";
import erela from ".";
import Playlist from "./features/playlist";
import Subscriptions from "./models/Subscriptions";
import constants from "./constants";

export function doesUserHaveBasicPremium({ interaction, member, user }: CallbackObject): CheckReturnObject {
  const cache = Subscriptions.shared.cache.filter(sub => sub.userId === user.id && sub.productId === 'MA-PREM-BASIC')
  if (constants.owners.includes(user.id)) return {
    result: true,
  }

  if (cache.length) {
    return {
      result: true,
    }
  } else {
    return {
      result: false,
      message: `Bạn không có gói Premium Cơ Bản để sử dụng tính năng này.`
    }
  }
}

export function doesUserHaveAdvancedPremium({ interaction, member, user }: CallbackObject): CheckReturnObject {
  const cache = Subscriptions.shared.cache.filter(sub => sub.userId === user.id && sub.productId === 'MA-PREM-ADVANCED')
  if (constants.owners.includes(user.id)) return {
    result: true,
  }

  if (cache.length) {
    return {
      result: true,
    }
  } else {
    return {
      result: false,
      message: `Bạn không có gói Premium Nâng Cấp để sử dụng tính năng này.`
    }
  }
}

export function isUserInVoiceChannel({ interaction, member, guild }: CallbackObject): CheckReturnObject {
  const voiceChannel = member.voice.channel;

  if (voiceChannel) {
    return {
      result: true,
    }
  } else {
    return {
      result: false,
      message: 'Hãy tham gia vào kênh thoại để nghe nhạc ^^!'
    }
  }
}

export function isPlayerAvailable({ guild }: CallbackObject): CheckReturnObject {
  const player = erela.get(guild.id);

  if (player) {
    return {
      result: true,
    }
  } else {
    return {
      result: false,
      message: 'Không có máy phát nhạc trong máy chủ này.'
    }
  }
}

export async function arePlaylistsAvailable({ user, client }: CallbackObject): Promise<CheckReturnObject> {
  const playlists = (await Playlist.shared.getPlaylists(client, user.id));

  if (!playlists || !playlists.length) return {
    result: false,
    message: 'Bạn không có danh sách phát nào cả.'
  }

  return {
    result: true,
  }
}