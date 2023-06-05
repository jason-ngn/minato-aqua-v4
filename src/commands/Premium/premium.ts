import { EmbedBuilder } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import constants from '../../constants'
import PremiumFeature from '../../features/premium'

export default class Premium extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'premium',
        description: "Xem thông tin về các gói premium của Minato Aqua."
      },
      callback: async ({
        interaction,
        client
      }) => {
        const embed = new EmbedBuilder()
          .setColor(constants.embed.color)
          .setTitle(`Giới thiệu về premium của Minato Aqua`)
          .setDescription(
            `Minato Aqua là 1 trong những bot phát nhạc có chất lượng xuất sắc. Vì thế, team dev không ngừng phát triển bot theo thời gian. Chúng tớ quyết định giới thiệu các gói premium đến với các cậu để đem đến một trải nghiệm nghe nhạc thuận tiện, có chất lượng cao và tốt hơn.`
          )
          .addFields({
            name: '\u200B',
            value: '**Các gói premium của Minato Aqua:**',
          })
          .setAuthor({
            iconURL: client.user?.displayAvatarURL(),
            name: 'Minato Aqua Premium'
          })

        const plans = PremiumFeature.shared.paypal.plans.filter(plan => plan.status === 'ACTIVE');
        const products = PremiumFeature.shared.paypal.products;

        for (const plan of plans.values()) {
          const planPrice = plan.billing_cycles!.find(c => c.tenure_type === 'REGULAR')!;
          const price = planPrice.pricing_scheme.fixed_price.value;
          const currency = planPrice.pricing_scheme.fixed_price.currency_code;
          const product = products.get(plan.product_id)!;
          let unit = ''

          if (planPrice.frequency.interval_unit === 'WEEK') unit = 'tuần'
          else if (planPrice.frequency.interval_unit === 'MONTH') unit = 'tháng';

          embed.addFields(
            {
              name: 'ID:',
              value: plan.product_id,
              inline: true,
            },
            {
              name: 'Tên:',
              value: plan.name,
              inline: true,
            },
            {
              name: 'Giá:',
              value: `${price} ${currency}/${unit}`,
              inline: true,
            },
            {
              name: 'Mô tả:',
              value: product.description
            }
          )
        }

        return await interaction.reply({
          embeds: [embed]
        })
      }
    })
  }
}