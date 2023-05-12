import { EmbedBuilder } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import constants from '../../constants'
import products from "../../products";

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

        for (const { product, plan } of products) {
          const planPrice = plan.billing_cycles.find(c => c.tenure_type === 'REGULAR')!;
          const price = planPrice.pricing_scheme.fixed_price.value;
          const currency = planPrice.pricing_scheme.fixed_price.currency_code;
          let unit = ''

          if (planPrice.frequency.interval_unit === 'WEEK') unit = 'tuần';
          else if (planPrice.frequency.interval_unit === 'MONTH') unit = 'tháng';

          embed.addFields(
            {
              name: 'ID:',
              value: product.id,
              inline: true,
            },
            {
              name: 'Tên gói:',
              value: product.name,
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