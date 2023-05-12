import { Client } from "discord.js";
import { FeatureTemplate } from "icytea-command-handler";
import constants from "../constants";
import PayPal from "../backend/paypal";
import Subscriptions from "../models/Subscriptions";

export default class Premium extends FeatureTemplate {
  public static readonly shared = new Premium()
  public paypal = new PayPal(constants.paypalConfig.sandbox.clientId, constants.paypalConfig.sandbox.secretKey)

  public async init(client: Client<boolean>): Promise<void> { }

  async cancelSubscription(subscriptionId: string) {
    await this.paypal.cancelSubscription(subscriptionId);
    await Subscriptions.shared.delete({
      subscriptionId
    })
  }

  async checkout(userId: string, productId: string, quantity: number, firstName: string, lastName: string) {
    const subscription = await this.paypal.createSubscription(userId, productId, quantity, {
      name: {
        given_name: firstName,
        surname: lastName,
      }
    })

    const approveLink = subscription.links.find((link: any) => link.rel === 'approve')!.href;

    return approveLink;
  }
}