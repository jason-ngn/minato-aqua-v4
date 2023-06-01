import { ApplicationCommandOptionType } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import Subscriptions from "../../models/Subscriptions";
import axios from "axios";
import Premium from "../../features/premium";

export default class CancelSubscription extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'cancel-subscription',
        description: 'Huỷ đăng kí gói premium của bạn.',
        options: [
          {
            name: 'subscription-id',
            description: 'ID của gói đăng kí của bạn.',
            required: true,
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
          }
        ]
      },
      autocompleteFunction: async (interaction, focusedArg, handler) => {
        const subCache = Subscriptions.shared.cache;
        const products = Premium.shared.paypal.products

        if (focusedArg.name === 'subscription-id') {
          if (!focusedArg.value.length) {
            return subCache.map(sub => ({
              name: `${sub.subscriptionId} - ${products.find(prod => prod.id === sub.productId)!.name}`,
              value: sub.subscriptionId,
            }))
          }

          const specificIds = subCache.filter(sub => sub.productId.match(new RegExp(`(${focusedArg.value})`, 'g')));
          if (!specificIds || !specificIds.length) return;

          return specificIds.map(sub => ({
            name: `${sub.subscriptionId} - ${products.find(prod => prod.id === sub.productId)!.name}`,
            value: sub.subscriptionId,
          }))
        }
      },
      callback: async ({
        interaction,
        client,
        options,
        guild,
        member,
        user,
        channel,
        handler
      }) => {
        const message = await interaction.deferReply();

        const subscriptionId = options.getString('subscription-id', true);
        const cache = Subscriptions.shared.cache;
        const plan = cache.find(p => p.subscriptionId === subscriptionId);

        if (!plan) return await interaction.editReply({
          content: `Gói đăng kí \`${subscriptionId}\` không tồn tại.`
        })

        await Premium.shared.cancelSubscription(subscriptionId)

        return await interaction.editReply({
          content: `Gói đăng kí \`${subscriptionId}\` đã được huỷ thành công.`
        })
      }
    })
  }
}