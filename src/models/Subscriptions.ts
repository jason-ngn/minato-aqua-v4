import { Template } from "mongo-database-handler";
import { SubscriptionStatus } from "../types";

export default class Subscriptions extends Template<{
  subscriptionId: string,
  userId: string,
  productId: string,
  nextBillingDate: Date,
  status: `${SubscriptionStatus}`
}> {
  public static readonly shared = new Subscriptions();

  constructor() {
    super({
      subscriptionId: {
        type: String,
        required: true,
      },
      userId: {
        type: String,
        required: true,
      },
      productId: {
        type: String,
        required: true,
      },
      nextBillingDate: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        required: true,
      }
    }, 'subscriptions')
  }
}