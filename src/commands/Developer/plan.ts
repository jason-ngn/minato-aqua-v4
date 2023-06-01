import { ActionRowBuilder, ApplicationCommandOptionType, ComponentType, EmbedBuilder, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, inlineCode } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import Premium from '../../features/premium'
import constants from "../../constants";
import { BillingCycle, OperationCode, PricingScheme, UpdateOperation } from "../../types";

const selectMenuId = 'select-menu';

const billingCycleModalId = 'billing-cycle-modal';
const tenureTypeSelectMenuId = 'tenure-type-select-menu';
const sequenceId = 'sequence';
const totalCyclesId = 'total-cycles';
const fixedPriceId = 'fixed-price';
const intervalUnitId = 'interval-unit';
const intervalCountId = 'interval-count';

const planSelectMenuId = 'plans-select-menu';
const objectSelectMenuId = 'object-select-menu-plans';
const operationSelectMenuId = 'operation-select-menu-plans';

const operations = {
  add: 'Thêm',
  replace: 'Thay đổi',
  remove: 'Xoá',
}

const attributes = {
  'description': 'Description',
  'payment_preferences/auto_bill_outstanding': 'Auto Bill Outstanding',
  'taxes/percentage': 'Tax Percentage',
  'payment_preferences/payment_failure_threshold': 'Payment Failure Threshold',
  'payment_preferences/setup_fee': 'Setup Fee',
  'payment_preferences/setup_fee_failure_action': 'Setup Fee Failure Action',
  'name': 'Name',
}
const valueModalId = 'value-modal-id';
const valueFieldId = 'value-field-id';

const updatePricingModalId = 'update-pricing-model';
const updatePricingSequenceId = 'update-pricing-sequence';
const updatePricingPriceId = 'update-pricing-price';

export default class Plan extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'plan',
        description: 'Các lệnh liên quan tới các gói premium.',
        options: [
          {
            name: 'show',
            description: "Xem các gói premium.",
            type: ApplicationCommandOptionType.Subcommand
          },
          {
            name: 'create',
            description: 'Tạo một gói premium.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'product-id',
                description: 'ID của sản phẩm mà bạn muốn tạo gói.',
                required: true,
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
              }
            ]
          },
          {
            name: 'add-billing-cycle',
            description: 'Thêm chu kì thanh toán vào gói.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'plan-temp-id',
                description: 'Mã gói tạm thời.',
                required: true,
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
              }
            ]
          },
          {
            name: 'finish-plan-creation',
            description: 'Hoàn thành việc tạo gói.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'plan-temp-id',
                description: 'Mã gói tạm thời.',
                required: true,
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
              }
            ]
          },
          {
            name: 'deactivate',
            description: 'Huỷ kích hoạt một gói.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'plan-id',
                description: 'Mã gói.',
                required: true,
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
              }
            ]
          },
          {
            name: 'edit',
            description: 'Chỉnh sửa thông tin gói.',
            type: ApplicationCommandOptionType.Subcommand
          },
          {
            name: 'activate',
            description: 'Kích hoạt một gói.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'plan-id',
                description: 'Mã gói.',
                required: true,
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
              }
            ]
          },
          {
            name: 'update-pricing',
            description: `Điều chỉnh giá của 1 gói.`,
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'plan-id',
                description: 'Mã gói.',
                required: true,
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
              }
            ]
          }
        ]
      },
      ownerOnly: true,
      autocompleteFunction: async (interaction, focusedArg, handler) => {
        const products = Premium.shared.paypal.products;
        const planTempCache = Premium.shared.planTempCache;
        const plans = Premium.shared.paypal.plans;
        const subcommand = interaction.options.getSubcommand();

        if (focusedArg.name === 'product-id') {
          if (!focusedArg.value.length) {
            return products.map(product => ({
              name: `${product.id} - ${product.name}`,
              value: product.id
            }))
          }

          const specificIds = products.filter(product => product.id.match(new RegExp(`(${focusedArg.value})`, 'g')));
          if (!specificIds || !specificIds.size) return;

          return specificIds.map(product => ({
            name: `${product.id} - ${product.name}`,
            value: product.id
          }))
        } else if (focusedArg.name === 'plan-temp-id') {
          if (!focusedArg.value.length) {
            return planTempCache.map((plan, planTempId) => ({
              name: `${planTempId} - ${plan.name}`,
              value: planTempId,
            }))
          }

          const specificIds = planTempCache.filter((plan, planTempId) => planTempId.match(new RegExp(`(${focusedArg.value})`, 'g')));
          if (!specificIds || !specificIds.size) return;

          return specificIds.map((plan, planTempId) => ({
            name: `${planTempId} - ${plan.name}`,
            value: planTempId
          }))
        } else if (focusedArg.name === 'plan-id') {
          if (['deactivate', 'activate'].includes(subcommand)) {
            if (subcommand === 'deactivate') {
              if (!focusedArg.value.length) {
                return plans
                  .filter(plan => plan.status === 'ACTIVE')
                  .map(plan => ({
                    name: `${plan.id} - ${plan.name}`,
                    value: plan.id
                  }))
              }

              const specificIds = plans.filter(plan => plan.id.match(new RegExp(`(${focusedArg.value})`, 'g')));
              if (!specificIds || !specificIds.size) return;

              return specificIds
                .filter(plan => plan.status === 'ACTIVE')
                .map(plan => ({
                  name: `${plan.id} - ${plan.name}`,
                  value: plan.id
                }))
            } else if (subcommand === 'activate') {
              if (!focusedArg.value.length) {
                return plans
                  .filter(plan => plan.status === 'INACTIVE')
                  .map(plan => ({
                    name: `${plan.id} - ${plan.name}`,
                    value: plan.id
                  }))
              }

              const specificIds = plans.filter(plan => plan.id.match(new RegExp(`(${focusedArg.value})`, 'g')));
              if (!specificIds || !specificIds.size) return;

              return specificIds
                .filter(plan => plan.status === 'INACTIVE')
                .map(plan => ({
                  name: `${plan.id} - ${plan.name}`,
                  value: plan.id
                }))
            }
          } else {
            if (!focusedArg.value.length) {
              return plans.map(plan => ({
                name: `${plan.id} - ${plan.name}`,
                value: plan.id,
              }))
            }

            const specificIds = plans.filter(plan => plan.id.match(new RegExp(`(${focusedArg.value})`, 'g')));
            if (!specificIds || !specificIds.size) return;

            return specificIds.map(plan => ({
              name: `${plan.id} - ${plan.name}`,
              value: plan.id
            }))
          }
        }
      },
      callback: async ({
        interaction,
        client,
        options,
        user
      }) => {
        const subcommand = options.getSubcommand()
        if (interaction.commandName === 'plan') {
          if (subcommand === 'show') {
            const message = await interaction.deferReply({
              fetchReply: true,
            })

            const plans = Premium.shared.paypal.plans;

            if (!plans.size) {
              return await interaction.editReply({
                content: `Không có gói nào.`
              })
            }

            const embed = new EmbedBuilder()
              .setColor(constants.embed.color)
              .setTitle(`Các gói đăng kí`)
              .setDescription(`${plans.size.toLocaleString('vi')} gói.`)

            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId(selectMenuId)
              .setPlaceholder(`Xem các gói ở đây.`)

            for (const plan of plans.values()) {
              const id = plan.id
              const name = plan.name;

              selectMenu.addOptions({
                label: name,
                description: id,
                value: id,
              })
            }

            await interaction.editReply({
              embeds: [embed],
              components: [
                new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu)
              ]
            })

            const collector = message.createMessageComponentCollector({
              filter: i => i.user.id === user.id && i.customId === selectMenuId,
              componentType: ComponentType.StringSelect,
              time: 60000
            })

            collector.on('collect', async i => {
              await i.deferUpdate()
              const planId = i.values[0];
              const plan = plans.get(planId)!;

              const planEmbed = new EmbedBuilder()
                .setColor(constants.embed.color)
                .setTitle(plan.name)
                .addFields(
                  {
                    name: 'ID:',
                    value: plan.id,
                    inline: true,
                  },
                  {
                    name: 'Trạng thái:',
                    value: plan.status as string,
                    inline: true,
                  }
                )

              for (const billingCycle of plan.billing_cycles!) {
                const frequency = `${billingCycle.frequency.interval_count} ${billingCycle.frequency.interval_unit}`;
                const type = billingCycle.tenure_type
                const sequence = billingCycle.sequence
                const totalCycles = billingCycle.total_cycles
                const pricingScheme = billingCycle.pricing_scheme

                planEmbed.addFields({
                  name: `Chu kì thanh toán ${sequence.toLocaleString('vi')}:`,
                  value: `Frequency: ${frequency}\nLoại: ${type}\nTổng số chu kì: ${totalCycles === 0 ? 'Vô tận (tới khi huỷ)' : totalCycles.toLocaleString('vi')}${pricingScheme ? `\nGiá: ${pricingScheme.fixed_price.value} ${pricingScheme.fixed_price.currency_code}` : ''}`
                })
              }

              planEmbed.addFields(
                {
                  name: 'Phí setup:',
                  value: `${plan.payment_preferences.setup_fee?.value} ${plan.payment_preferences.setup_fee?.currency_code}`
                }
              )

              if (plan.taxes) {
                planEmbed.addFields(
                  {
                    name: 'Thuế:',
                    value: `${plan.taxes.percentage}% (${plan.taxes.inclusive === true ? 'Giá đã bao gồm thuế' : 'Giá chưa bao gồm thuế'})`
                  }
                )
              }

              await interaction.editReply({
                embeds: [planEmbed]
              })
            })

            collector.on('end', async collected => {
              await interaction.editReply({
                components: [
                  new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                    StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
                  )
                ]
              })
            })
          } else if (subcommand === 'create') {
            await interaction.deferReply();
            const productId = options.getString('product-id', true);

            const product = Premium.shared.paypal.products.get(productId);
            if (!product) {
              return await interaction.reply({
                ephemeral: true,
                content: `Mã sản phẩm \`${productId}\` không tồn tại.`
              })
            }

            const planTempId = Premium.shared.initiateCreatePlan(productId);

            return await interaction.editReply({
              content: `Đây là mã gói tạm thời: \`${planTempId}\`\nDùng lệnh **/plan add-billing-cycle** để thêm chu kì thanh toán.`
            })
          } else if (subcommand === 'add-billing-cycle') {
            const message = await interaction.deferReply({
              fetchReply: true,
            })

            const planTempId = options.getString('plan-temp-id', true);
            const planTemp = Premium.shared.planTempCache.get(planTempId);

            if (!planTemp) {
              return await interaction.reply({
                ephemeral: true,
                content: `Mã gói tạm thời \`${planTempId}\` không tồn tại.`
              })
            }

            const tenureTypeSelectMenu = new StringSelectMenuBuilder()
              .setCustomId(tenureTypeSelectMenuId)
              .setPlaceholder(`Chọn loại chu kì ở đây.`)
              .setOptions(
                {
                  label: 'TRIAL',
                  value: 'TRIAL',
                  description: `Chu kì dùng thử.`
                },
                {
                  label: 'REGULAR',
                  value: 'REGULAR',
                  description: 'Chu kì mặc định.'
                }
              )

            await interaction.editReply({
              content: `Chọn loại chu kì:`,
              components: [
                new ActionRowBuilder<StringSelectMenuBuilder>()
                  .addComponents(tenureTypeSelectMenu)
              ]
            })

            const collector = message.createMessageComponentCollector({
              filter: i => i.user.id === user.id && i.customId === tenureTypeSelectMenuId,
              max: 1,
              componentType: ComponentType.StringSelect
            })

            collector.on('end', async collected => {
              const first = collected.first()!;
              const tenureType = first.values[0];

              const sequenceField = new TextInputBuilder()
                .setCustomId(sequenceId)
                .setLabel(`Thứ tự chu kì:`)
                .setPlaceholder(`Lưu ý: Trial phải đứng trước Regular.`)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)

              const totalCyclesField = new TextInputBuilder()
                .setCustomId(totalCyclesId)
                .setLabel(`Tổng số chu kì:`)
                .setPlaceholder(`Lưu ý: Trial (1-999), Regular: (1-999 hoặc 0)`)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)

              const fixedPriceField = new TextInputBuilder()
                .setCustomId(fixedPriceId)
                .setLabel(`Giá:`)
                .setPlaceholder(`1.99, 2.99, 3.99, ...`)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)

              const intervalUnitField = new TextInputBuilder()
                .setCustomId(intervalUnitId)
                .setLabel(`Đơn vị chu kì:`)
                .setPlaceholder(`DAY, WEEK, MONTH, hoặc YEAR.`)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)

              const intervalCountField = new TextInputBuilder()
                .setCustomId(intervalCountId)
                .setLabel(`Số chu kì:`)
                .setPlaceholder(`Lưu ý: DAY (365), WEEK (52), MONTH (12), YEAR (1)`)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)

              const modal = new ModalBuilder()
                .setCustomId(billingCycleModalId)
                .setTitle(`Thêm chu kì thanh toán`)
                .addComponents(
                  new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(sequenceField),
                  new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(totalCyclesField),
                  new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(fixedPriceField),
                  new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(intervalUnitField),
                  new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(intervalCountField)
                )

              await first.showModal(modal);

              const modalSubmit = await first.awaitModalSubmit({
                filter: i => i.user.id === user.id && i.customId === billingCycleModalId,
                time: 60000 * 10,
              })

              await modalSubmit.deferUpdate()

              const sequence = parseInt(modalSubmit.fields.getTextInputValue(sequenceId));
              const totalCycles = parseInt(modalSubmit.fields.getTextInputValue(totalCyclesId));
              const fixedPrice = modalSubmit.fields.getTextInputValue(fixedPriceId)
              const intervalUnit = modalSubmit.fields.getTextInputValue(intervalUnitId).toUpperCase();
              const intervalCount = parseInt(modalSubmit.fields.getTextInputValue(intervalCountId));

              const billingCycle: BillingCycle = {
                tenure_type: tenureType as 'REGULAR' | 'TRIAL',
                sequence,
                total_cycles: totalCycles,
                pricing_scheme: {
                  fixed_price: {
                    currency_code: 'USD',
                    value: fixedPrice
                  }
                },
                frequency: {
                  interval_unit: intervalUnit as any,
                  interval_count: intervalCount
                }
              }

              const res = Premium.shared.updateBillingCyclesOfTempPlan(planTempId, billingCycle);

              await modalSubmit.editReply({
                content: `Đã thêm chu kì thanh toán vào gói tạm thời \`${planTempId}\` thành công.`,
                components: []
              })

              return;
            })
          } else if (subcommand === 'finish-plan-creation') {
            await interaction.deferReply();

            const planTempId = options.getString('plan-temp-id', true);
            const planTemp = Premium.shared.planTempCache.get(planTempId);

            if (!planTemp) {
              return await interaction.editReply({
                content: `Mã gói tạm thời \`${planTempId}\` không tồn tại.`
              })
            }

            const res = await Premium.shared.finishCreatePlan(planTempId);

            return await interaction.editReply({
              content: `Bạn đã tạo gói thành công. Đây là mã gói: \`${res}\`.`
            })
          } else if (subcommand === 'deactivate') {
            await interaction.deferReply();
            const planId = options.getString('plan-id', true);
            const plan = Premium.shared.paypal.plans.get(planId);

            if (!plan) {
              return await interaction.editReply({
                content: `Mã gói \`${planId}\` không tồn tại.`
              })
            }

            await Premium.shared.deactivatePlan(plan.id);

            return await interaction.editReply({
              content: `Đã huỷ kích hoạt gói \`${plan.id}\` thành công.`
            })
          } else if (subcommand === 'edit') {
            const message = await interaction.deferReply({
              fetchReply: true,
            })

            const plans = Premium.shared.paypal.plans;

            const planSelectMenu = new StringSelectMenuBuilder()
              .setCustomId(planSelectMenuId)
              .setPlaceholder(`Chọn gói ở đây.`)

            for (const plan of plans.values()) {
              const id = plan.id;
              const name = plan.name;

              planSelectMenu.addOptions({
                label: name,
                description: id,
                value: id,
              })
            }

            const objectSelectMenu = new StringSelectMenuBuilder()
              .setCustomId(objectSelectMenuId)
              .setPlaceholder('Chọn thuộc tính ở đây.')

            for (const attribute in attributes) {
              const name = (attributes as any)[attribute];

              objectSelectMenu.addOptions({
                label: name,
                value: attribute
              })
            }

            const operationSelectMenu = new StringSelectMenuBuilder()
              .setCustomId(operationSelectMenuId)
              .setPlaceholder('Chọn hành động ở đây.')

            for (const operation in operations) {
              const name = (operations as any)[operation];

              operationSelectMenu.addOptions({
                label: name,
                value: operation
              })
            }

            let planId = '';
            const op: UpdateOperation = {
              op: '',
              path: ''
            }

            await interaction.editReply({
              content: `Chọn gói bạn muốn chỉnh sửa.`,
              components: [
                new ActionRowBuilder<StringSelectMenuBuilder>()
                  .addComponents(planSelectMenu)
              ]
            })

            const collector = message.createMessageComponentCollector({
              filter: i => i.user.id === user.id,
              max: 3,
              componentType: ComponentType.StringSelect
            })

            collector.on('collect', async i => {
              const customId = i.customId;

              if (customId === planSelectMenuId) {
                await i.deferUpdate();
                planId = i.values[0];

                await interaction.editReply({
                  content: `Chọn thuộc tính bạn muốn chỉnh sửa.`,
                  components: [
                    new ActionRowBuilder<StringSelectMenuBuilder>()
                      .addComponents(objectSelectMenu)
                  ]
                })
              } else if (customId === objectSelectMenuId) {
                await i.deferUpdate()
                op.path = i.values[0];

                await interaction.editReply({
                  content: `Chọn hành động bạn muốn thực hiện.`,
                  components: [
                    new ActionRowBuilder<StringSelectMenuBuilder>()
                      .addComponents(operationSelectMenu)
                  ]
                })
              } else if (customId === operationSelectMenuId) {
                op.op = i.values[0] as OperationCode;

                const modal = new ModalBuilder()
                  .setCustomId(valueModalId)
                  .setTitle(`Giá trị`)
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>()
                      .setComponents(
                        new TextInputBuilder()
                          .setCustomId(valueFieldId)
                          .setLabel(`Giá trị:`)
                          .setPlaceholder('ABC...')
                          .setStyle(TextInputStyle.Paragraph)
                          .setMaxLength(256)
                      )
                  )

                await i.showModal(modal);

                const modalSubmit = await i.awaitModalSubmit({
                  filter: newI => newI.user.id === user.id && newI.customId === valueModalId,
                  time: 60000 * 10
                })

                await modalSubmit.deferUpdate();
                const value = modalSubmit.fields.getTextInputValue(valueFieldId);

                if (value) op.value = value;
                await Premium.shared.updatePlan(planId, op.path as string, op.op as any, value);

                await interaction.editReply({
                  components: [],
                  content: `Đã chỉnh sửa gói \`${planId}\` thành công.`
                })
              }
            })
          } else if (subcommand === 'activate') {
            await interaction.deferReply();
            const planId = options.getString('plan-id', true);
            const plan = Premium.shared.paypal.plans.get(planId);

            if (!plan) {
              return await interaction.editReply({
                content: `Gói \`${planId}\` không tồn tại.`
              })
            }

            await Premium.shared.activatePlan(planId);

            return await interaction.editReply({
              content: `Đã kích hoạt gói \`${planId}\` thành công.`
            })
          } else if (subcommand === 'update-pricing') {
            const planId = options.getString('plan-id', true);
            const plan = Premium.shared.paypal.plans.get(planId);

            if (!plan) {
              return await interaction.reply({
                ephemeral: true,
                content: `Gói \`${planId}\` không tồn tại.`
              })
            }

            const modal = new ModalBuilder()
              .setCustomId(updatePricingModalId)
              .setTitle(`Điều chỉnh giá.`)
              .setComponents(
                new ActionRowBuilder<TextInputBuilder>()
                  .setComponents(
                    new TextInputBuilder()
                      .setCustomId(updatePricingSequenceId)
                      .setLabel(`Thứ tự chu kì:`)
                      .setStyle(TextInputStyle.Short)
                      .setRequired(true)
                      .setPlaceholder('1, 2, 3, ...')
                  ),
                new ActionRowBuilder<TextInputBuilder>()
                  .setComponents(
                    new TextInputBuilder()
                      .setCustomId(updatePricingPriceId)
                      .setLabel(`Giá:`)
                      .setStyle(TextInputStyle.Short)
                      .setRequired(true)
                      .setPlaceholder(`1.00, 2.00, ...`)
                  )
              )

            await interaction.showModal(modal);

            const modalSubmit = await interaction.awaitModalSubmit({
              filter: i => i.user.id === user.id && i.customId === updatePricingModalId,
              time: 60000 * 10,
            })

            await modalSubmit.deferReply()

            const sequence = parseInt(modalSubmit.fields.getTextInputValue(updatePricingSequenceId));
            const price = modalSubmit.fields.getTextInputValue(updatePricingPriceId);

            const pricingScheme: {
              billing_cycle_sequence: number;
              pricing_scheme: PricingScheme
            } = {
              billing_cycle_sequence: sequence,
              pricing_scheme: {
                fixed_price: {
                  value: price,
                  currency_code: 'USD'
                }
              }
            }

            await Premium.shared.updatePricingOfPlan(planId, [pricingScheme]);

            return await modalSubmit.editReply({
              content: `Đã cập nhật giá của gói \`${planId}\` thành công.`
            })
          }
        }
      }
    })
  }
}