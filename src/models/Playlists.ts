import { Template } from "mongo-database-handler";

export default class Playlists extends Template<{
  userId: string;
  playlists: {
    name: string;
    tracks: string[];
  }[]
}> {
  public static readonly shared = new Playlists();

  constructor() {
    super({
      userId: {
        type: String,
        required: true,
      },
      playlists: {
        type: [Object],
      }
    }, 'playlists')
  }
}