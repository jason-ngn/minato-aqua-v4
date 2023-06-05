import { CommandTemplate } from "icytea-command-handler";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import constants from "../../constants";
import Premium from "../../features/premium";

const selectMenuId = 'select-menu';
const cancelId = 'cancel';

export default class Subscribe extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'subscribe',
        description: 'Đăng kí gói premium bất kì.'
      },
      callback: async ({
        interaction,
        client,
        user,
        guild,
        member,
        options,
        channel
      }) => {
        const message = await interaction.deferReply({
          fetchReply: true,
          ephemeral: true,
        })

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(selectMenuId)
          .setPlaceholder('Chọn gói premium bạn muốn ở đây.')

        const cancelButton = new ButtonBuilder()
          .setCustomId(cancelId)
          .setStyle(ButtonStyle.Secondary)
          .setLabel(`Huỷ`)

        const plans = Premium.shared.paypal.plans.filter(plan => plan.status === 'ACTIVE');
        for (const plan of plans.values()) {
          const name = plan.name
          const id = plan.product_id;
          const price = plan.billing_cycles!.find(cycle => cycle.tenure_type === 'REGULAR')!;
          const trial = plan.billing_cycles!.find(cycle => cycle.tenure_type === 'TRIAL');
          let trialType: string = '';

          if (trial) {
            trialType = trial.frequency.interval_unit;
            if (trialType === 'WEEK') trialType = 'tuần';
            else if (trialType === 'MONTH') trialType = 'tháng';
          }

          const description = `${price.pricing_scheme.fixed_price.value} ${price.pricing_scheme.fixed_price.currency_code}/tháng ${trial && trialType ? `- ${trial.total_cycles.toLocaleString()} ${trialType} dùng thử` : ''}`

          selectMenu.addOptions({
            label: name,
            value: id,
            description,
          })
        }

        await interaction.editReply({
          components: [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
            new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton)
          ],
          embeds: [
            new EmbedBuilder()
              .setColor(constants.embed.color)
              .setDescription(`Chọn gói premium bạn muốn đăng kí ở bên dưới.`)
          ]
        })

        const collector = message.createMessageComponentCollector({
          filter: i => i.user.id === user.id,
          max: 1,
          componentType: ComponentType.StringSelect
        })

        const buttonCollector = message.createMessageComponentCollector({
          filter: i => i.user.id === user.id && i.customId === cancelId,
          max: 1,
          componentType: ComponentType.Button,
        })

        buttonCollector.on('end', async collected => {
          const first = collected.first();

          await first?.deferUpdate()
          collector.stop('cancelled')
        })

        collector.on('end', async collected => {
          const first = collected.first();
          if (!first) {
            await interaction.editReply({
              components: [],
              embeds: [],
              content: `Bạn đã huỷ đăng kí gói premium.`
            })

            return;
          }
          await first.deferUpdate();
          const productId = first.values[0];

          const approveLink = await Premium.shared.checkout(user.id, productId);

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(constants.embed.color)
                .setDescription(`Hãy nhấn vào đường dẫn ở bên dưới để chuyển tới trang đăng kí.`)
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setURL(approveLink)
                  .setLabel(`Nhấn vào đây.`)
              )
            ]
          })
        })
      }
    })
  }
}