import { Client } from "discord.js";
import express from 'express'
import Subscriptions from "../models/Subscriptions";
import Premium from "../features/premium";

export default class Backend {
  public app = express()
  public port: number;
  public client: Client;
  public paypal = Premium.shared.paypal;

  constructor(client: Client, port: number) {
    this.port = port;
    this.client = client;
    this.app.use(express.json())
    this.app.listen(port, () => console.log(`Listening on port ${port}`))

    this.app.get('/success', async (req, res) => {
      const subscriptionId = req.query.subscription_id as string;
      const userId = this.paypal.subscriptionIdTempCache.findKey(sub => sub.subscriptionId === subscriptionId)!;
      const sub = this.paypal.subscriptionIdTempCache.get(userId)!;
      res.status(200).send(`Your subscription ID is ${subscriptionId}. You can close this page now.`)

      const { billing_info: { next_billing_time } } = await this.paypal.getSubscriptionDetails(subscriptionId);
      const nextBillingDate = new Date(next_billing_time);

      await Subscriptions.shared.update({ userId }, {
        subscriptionId,
        userId,
        productId: sub.productId,
        nextBillingDate,
      })
    })

    this.app.get('/cancel', async (req, res) => {
      res.status(200).send('The payment has been cancelled. Please close this page.')
    })
  }
}