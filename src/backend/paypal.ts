import constants from "../constants";
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { Plan, Subscription, Subscriber, UpdateOperation } from "../types";
import { Collection } from "discord.js";
import Subscriptions from "../models/Subscriptions";
import products from "../products";

type PlanExtended = Plan & {
  id: string;
  links: any[];
  create_time: string;
  update_time: string;
}

export default class PayPal {
  public accessToken = ''
  public clientID: string;
  public secretKey: string;
  public interval: NodeJS.Timer = setInterval(() => { }, 10)
  public plans = new Collection<string, PlanExtended>()
  public subscriptions = new Collection<string, {
    subscriptionId: string,
    userId: string,
    productId: string,
    nextBillingDate: Date,
  }>()
  public subscriptionIdTempCache = new Collection<string, {
    subscriptionId: string;
    productId: string;
  }>()
  public products = new Collection<string, {
    id: string;
    name: string;
    description: string;
    type: string;
  }>()
  public getURL(endpoint: string, queries = {}) {
    let url = 'https://api-m.sandbox.paypal.com/v1';

    if (constants.Beta === false) {
      url = 'https://api-m.paypal.com/v1'
    }

    url = url + endpoint
    if (Object.keys(queries).length) url = `${url}?${new URLSearchParams(queries)}`

    return url;
  }

  constructor(clientID: string, secretKey: string) {
    this.clientID = clientID;
    this.secretKey = secretKey

    this.getAccessToken().then(async (res) => {
      this.interval = setInterval(async () => this.getAccessToken(), res.expires_in)

      await this.loadProducts();
      await this.loadPlans();
      await this.loadSubscriptions();
    })
  }

  async getAccessToken() {
    const res = await this.request({
      method: 'POST',
      endpoint: '/oauth2/token',
      queries: {
        'grant_type': 'client_credentials'
      },
      auth: {
        username: this.clientID,
        password: this.secretKey,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
    })
    this.accessToken = res.data.access_token;
    return res.data;
  }

  async loadProducts() {
    const { data: { products: productsRes } } = await this.request({
      method: 'GET',
      endpoint: '/catalogs/products',
    })

    if (!productsRes.length) {
      for (const { product } of products) {
        await this.createProduct(product);
      }

      await this.loadProducts();
      return;
    }

    for (const product of productsRes) {
      this.products.set(product.id, product);
    }
    console.log(this.products)
    return this.products.size;
  }

  async updatePlan(planId: string, operations: UpdateOperation[]) {
    const res = await this.request({
      method: 'PATCH',
      endpoint: `/billing/plans/${planId}`,
      data: operations
    })

    return res.data;
  }

  async updateProduct(productId: string, operations: UpdateOperation[]) {
    const res = await this.request({
      method: 'PATCH',
      endpoint: `/catalogs/products/${productId}`,
      data: operations
    })

    return res.data;
  }

  async cancelSubscription(subscriptionId: string) {
    const res = await this.request({
      method: 'POST',
      endpoint: `/billing/subscriptions/${subscriptionId}/cancel`,
      data: {
        reason: 'User wanted to cancel.'
      }
    })

    return res.data;
  }

  async getSubscriptionDetails(subscriptionId: string) {
    const res = await this.request({
      method: 'GET',
      endpoint: `/billing/subscriptions/${subscriptionId}`,
    })

    return res.data;
  }

  getPlan(productId: string): [string, Plan] | undefined {
    const key = this.plans.findKey(plan => plan.product_id === productId && plan.status === 'ACTIVE');
    if (!key) return undefined;
    const plan = this.plans.get(key);
    if (!plan) return undefined;
    return [key, plan];
  }

  async createSubscription(userId: string, productId: string, quantity: number, subscriber: Subscriber, custom_id?: string, start_time?: string) {
    let res: AxiosResponse;

    const [planId, plan] = this.getPlan(productId)!;

    if (!planId || !plan) throw new Error(`Plan invalid.`)

    const subscription: Subscription = {
      plan_id: planId,
      quantity: quantity.toString(),
      subscriber,
      plan: {
        billing_cycles: plan.billing_cycles,
        payment_preferences: plan.payment_preferences
      },
      application_context: {
        brand_name: 'Minato Aqua',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${constants.baseURL}/success`,
        cancel_url: `${constants.baseURL}/cancel`
      }
    }

    if (start_time) subscription.start_time = start_time;
    if (custom_id) subscription.custom_id = custom_id;

    try {
      res = await this.request({
        method: 'POST',
        endpoint: '/billing/subscriptions',
        data: subscription,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (e: any) {
      throw new Error(`Checkout error.`)
    }

    const subscriptionId = res.data.id;
    this.subscriptionIdTempCache.set(userId, {
      subscriptionId,
      productId,
    });

    return res!.data;
  }

  async loadSubscriptions() {
    const results = await Subscriptions.shared.cache;

    for (const result of results) {
      this.subscriptions.set(result.subscriptionId, result);
    }

    return this.subscriptions.size;
  }

  async createPlan(plan: Plan) {
    const res = await this.request({
      method: 'POST',
      endpoint: '/billing/plans',
      data: plan,
    })

    return res.data
  }

  async deactivatePlan(planID: string) {
    const res = await this.request({
      method: 'POST',
      endpoint: `/billing/plans/${planID}/deactivate`
    })

    return res.data;
  }

  async loadPlans() {
    const { data: { plans } } = await this.request({
      method: 'GET',
      endpoint: '/billing/plans',
    })

    if (!plans.length) {
      for (const { plan } of products) {
        await this.createPlan(plan);
      }

      await this.loadPlans();
      return this.plans.size;
    }
    console.log(plans)

    for (const plan of plans) {
      const planDetails = await this.getPlanDetails(plan.id);
      this.plans.set(plan.id, planDetails);
    }

    return this.plans.size;
  }

  async getPlanDetails(planId: string) {
    const res = await this.request({
      method: 'GET',
      endpoint: `/billing/plans/${planId}`
    })

    return res.data;
  }

  async createProduct({
    id,
    name,
    description,
    type,
  }: {
    id: string;
    name: string;
    description: string;
    type: 'DIGITAL' | string;
  }) {
    const res = await this.request({
      method: 'POST',
      endpoint: '/catalogs/products',
      data: {
        id,
        name,
        description,
        type,
      }
    })

    return res.data
  }

  async request({
    endpoint,
    queries,
    headers,
    data,
    auth,
    method,
  }: {
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
    endpoint: string;
    queries?: {
      [query: string]: string
    };
    headers?: {
      [header: string]: string;
    };
    data?: {
      [element: string]: any;
    };
    auth?: {
      username: string;
      password: string;
    }
  }) {
    if (endpoint !== '/oauth2/token') {
      if (!this.accessToken) throw new Error(`Access token invalid.`)
    }

    let payload: AxiosRequestConfig = {
      method,
      url: this.getURL(endpoint, queries),
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (this.accessToken) payload.headers!.Authorization = `Bearer ${this.accessToken}`

    if (headers) payload.headers = {
      ...payload.headers,
      ...headers,
    }

    if (data) payload.data = data;
    if (auth) payload.auth = auth;

    const res = await axios.request(payload);

    return res;
  }
}