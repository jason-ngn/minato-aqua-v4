import { CommandTemplate } from "icytea-command-handler";
import Subscriptions from "../../models/Subscriptions";
import products from "../../products";
import { EmbedBuilder } from "discord.js";
import constants from "../../constants";

export default class ShowSubscriptions extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'show-subscriptions',
        description: 'Xem các gói đăng kí của bạn.'
      },
      callback: async ({
        interaction,
        client,
        guild,
        member,
        user,
        channel,
        handler
      }) => {
        const message = await interaction.deferReply({
          fetchReply: true,
        })

        const cache = Subscriptions.shared.cache.filter(sub => sub.userId === user.id);
        if (!cache.length) return await interaction.editReply({
          content: `Bạn không có gói đăng kí nào.`
        })

        const embed = new EmbedBuilder()
          .setColor(constants.embed.color)
          .setAuthor({
            name: `Các gói đăng kí của ${user.username}`
          })

        for (const subscription of cache) {
          embed.addFields(
            {
              name: `ID của gói đăng kí:`,
              value: `\`${subscription.subscriptionId}\``,
              inline: true,
            },
            {
              name: `Gói:`,
              value: products.find(prod => prod.product.id === subscription.productId)!.product.name,
              inline: true,
            },
            {
              name: `Ngày thanh toán tiếp theo:`,
              value: subscription.nextBillingDate.toLocaleDateString('vi'),
              inline: true,
            }
          )
        }

        return await interaction.editReply({
          embeds: [embed]
        })
      }
    })
  }
}