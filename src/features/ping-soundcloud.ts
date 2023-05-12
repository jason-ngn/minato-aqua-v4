import axios from "axios";
import { Client } from "discord.js";
import { FeatureTemplate } from "icytea-command-handler";

export default class PingSC extends FeatureTemplate {
  public static readonly shared = new PingSC();
  public pageAvailable: boolean = false;

  public async init(client: Client<boolean>): Promise<void> {
    const fifteenMins = 900000

    const pingSoundcloud = () => {
      axios.request({
        method: 'GET',
        url: 'https://www.soundcloud.com',
      })
        .then((value) => {
          if (value.status === 200) {
            this.pageAvailable = true;
          }
        })
        .catch(() => {
          this.pageAvailable = false;
        })
    }

    pingSoundcloud();

    setInterval(pingSoundcloud, fifteenMins);
  }
}