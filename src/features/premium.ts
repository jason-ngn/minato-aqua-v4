import { Client, Collection } from "discord.js";
import { FeatureTemplate } from "icytea-command-handler";
import constants from "../constants";
import PayPal from "../backend/paypal";
import Subscriptions from "../models/Subscriptions";
import { Plan, PricingScheme, UpdateOperation } from "../types";
import { getRandomStringOfNumbers } from '../functions'
import { BillingCycle } from "../types";

export default class Premium extends FeatureTemplate {
  public static readonly shared = new Premium()
  public paypal = new PayPal(constants.Beta === true ? constants.paypalConfig.sandbox.clientId : constants.paypalConfig.live.clientId, constants.Beta === true ? constants.paypalConfig.sandbox.secretKey : constants.paypalConfig.live.secretKey)
  public planTempCache: Collection<string, Plan> = new Collection();

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

  async createProduct(id: string, name: string, type: 'DIGITAL', description: string) {
    await this.paypal.createProduct({
      id,
      name,
      type,
      description
    })
  }

  async updateProduct(productId: string, object: 'description' | 'category' | 'image_url' | 'home_url', operation: 'add' | 'replace' | 'remove', value?: string) {
    const op: UpdateOperation = {
      op: operation,
      path: `/${object}`,
    }

    if (value) op.value = value;

    await this.paypal.updateProduct(productId, [op]);
  }

  async updatePlan(planId: string, object: string, operation: 'add' | 'replace' | 'remove', value?: string) {
    const op: UpdateOperation = {
      op: operation,
      path: `/${object}`
    }

    if (value) op.value = value;
    await this.paypal.updatePlan(planId, [op]);
  }

  initiateCreatePlan(productId: string) {
    const product = this.paypal.products.get(productId)!;

    const planConfig: Plan = {
      product_id: product.id,
      name: product.name,
      billing_cycles: [],
      status: 'ACTIVE',
      payment_preferences: {
        setup_fee_failure_action: 'CANCEL',
      }
    }

    const planTempId = getRandomStringOfNumbers();
    this.planTempCache.set(planTempId, planConfig);

    return planTempId;
  }

  updateBillingCyclesOfTempPlan(planTempId: string, billingCycle: BillingCycle) {
    const planTemp = this.planTempCache.get(planTempId);

    if (!planTemp) return false;
    planTemp.billing_cycles?.push(billingCycle);
    planTemp.billing_cycles?.sort((a, b) => a.sequence - b.sequence);
    this.planTempCache.set(planTempId, planTemp);

    return true;
  }

  async finishCreatePlan(planTempId: string) {
    const planTemp = this.planTempCache.get(planTempId)!;

    const data = await this.paypal.createPlan(planTemp)

    return data.id
  }

  async deactivatePlan(planId: string) {
    await this.paypal.deactivatePlan(planId);
  }

  async activatePlan(planId: string) {
    await this.paypal.activatePlan(planId);
  }

  async updatePricingOfPlan(planId: string, pricingSchemes: {
    billing_cycle_sequence: number;
    pricing_scheme: PricingScheme
  }[]) {
    await this.paypal.updatePricing(planId, pricingSchemes)
  }

  doesUserHavePremium(userId: string) {
    const res = Subscriptions.shared.cache.find(sub => sub.userId === userId)
    if (constants.owners.includes(userId)) return {
      result: true,
    }

    if (res) return true;
    else return false;
  }

  checkForPremium(userId: string, productId: string) {
    const res = Subscriptions.shared.cache.find(sub => sub.userId === userId && sub.productId === productId)
    if (constants.owners.includes(userId)) return {
      result: true,
    }

    if (res) return true;
    else return false;
  }
}