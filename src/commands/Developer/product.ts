import { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ApplicationCommandOptionType, EmbedBuilder, StringSelectMenuBuilder, ComponentType } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import Premium from "../../features/premium";
import constants from "../../constants";
import { UpdateOperation } from "../../types";
import { OperationCode } from "../../types";

const modalId = 'product-modal';
const idFieldId = 'product-id';
const nameId = 'product-name';
const descriptionId = 'product-description';

const selectMenuId = 'select-menu';

const productSelectMenuId = 'product-select-menu';
const objectSelectMenuId = 'object-select-menu';
const operationSelectMenuId = 'operation-select-menu';

const attributes = {
  description: 'Description',
  category: 'Category',
  image_url: 'Image URL',
  home_url: 'Home URL'
}

const operations = {
  add: 'Thêm',
  replace: 'Thay đổi',
  remove: 'Xoá',
}

const valueModalId = 'value-modal-id';
const valueFieldId = 'value-field-id';

export default class Product extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'product',
        description: 'Các lệnh liên quan tới các gói premium.',
        options: [
          {
            name: 'create',
            description: 'Tạo sản phẩm cho gói premium.',
            type: ApplicationCommandOptionType.Subcommand
          },
          {
            name: 'show',
            description: 'Xem các sản phẩm của các gói premium.',
            type: ApplicationCommandOptionType.Subcommand
          },
          {
            name: 'edit',
            description: 'Chỉnh sửa thông tin sản phẩm.',
            type: ApplicationCommandOptionType.Subcommand
          }
        ]
      },
      ownerOnly: true,
      callback: async ({
        interaction,
        client,
        guild,
        user,
        options
      }) => {
        const subcommand = options.getSubcommand();

        if (subcommand === 'create') {
          const modal = new ModalBuilder()
            .setCustomId(modalId)
            .setTitle(`Tạo sản phẩm`)
            .setComponents(
              new ActionRowBuilder<TextInputBuilder>()
                .setComponents(
                  new TextInputBuilder()
                    .setCustomId(idFieldId)
                    .setLabel('ID:')
                    .setRequired(true)
                    .setPlaceholder('MA-PREM-BASIC')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(50)
                ),
              new ActionRowBuilder<TextInputBuilder>()
                .setComponents(
                  new TextInputBuilder()
                    .setCustomId(nameId)
                    .setLabel('Tên:')
                    .setRequired(true)
                    .setPlaceholder('Premium Cơ Bản')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(127)
                ),
              new ActionRowBuilder<TextInputBuilder>()
                .setComponents(
                  new TextInputBuilder()
                    .setCustomId(descriptionId)
                    .setLabel('Mô tả:')
                    .setRequired(true)
                    .setPlaceholder('Đây là một sản phẩm rất tốt...')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(256)
                ),
            )

          await interaction.showModal(modal);
          const type = 'DIGITAL';

          const modalSubmit = await interaction.awaitModalSubmit({
            filter: i => i.user.id === user.id && i.customId === modalId,
            time: 60000 * 10,
          })

          await modalSubmit.deferReply();

          const id = modalSubmit.fields.getTextInputValue(idFieldId)
          const name = modalSubmit.fields.getTextInputValue(nameId)
          const description = modalSubmit.fields.getTextInputValue(descriptionId)

          await Premium.shared.createProduct(id, name, type, description)

          await modalSubmit.editReply({
            content: `Đã tạo sản phẩm thành công.`
          })
        } else if (subcommand === 'show') {
          const message = await interaction.deferReply({
            fetchReply: true,
          });

          const products = Premium.shared.paypal.products

          if (!products.size) {
            return await interaction.editReply({
              content: `Không có sản phẩm nào.`
            })
          }

          const embed = new EmbedBuilder()
            .setColor(constants.embed.color)
            .setTitle(`Các sản phẩm`)
            .setDescription(`${products.size.toLocaleString('vi')} sản phẩm.`)

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(selectMenuId)
            .setPlaceholder(`Xem các sản phẩm ở đây.`)

          for (const product of products.values()) {
            const id = product.id;
            const name = product.name;

            selectMenu.addOptions({
              label: name,
              description: id,
              value: id
            })
          }

          await interaction.editReply({
            embeds: [embed],
            components: [
              new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)
            ]
          })

          const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === user.id && i.customId === selectMenuId,
            componentType: ComponentType.StringSelect,
            time: 60000,
          })

          collector.on('collect', async i => {
            await i.deferUpdate()
            const productId = i.values[0];

            const product = products.get(productId)!;

            const productEmbed = new EmbedBuilder()
              .setColor(constants.embed.color)
              .setTitle(product.name)
              .setFields(
                {
                  name: 'ID:',
                  value: product.id
                },
                {
                  name: 'Mô tả:',
                  value: product.description
                }
              )

            await interaction.editReply({
              embeds: [productEmbed]
            })
          })

          collector.on('end', async collected => {
            await interaction.editReply({
              components: [
                new ActionRowBuilder<StringSelectMenuBuilder>()
                  .setComponents(
                    StringSelectMenuBuilder
                      .from(selectMenu)
                      .setDisabled(true)
                  )
              ]
            })
          })
        } else if (subcommand === 'edit') {
          const message = await interaction.deferReply({
            fetchReply: true,
          })

          const products = Premium.shared.paypal.products;

          const productSelectMenu = new StringSelectMenuBuilder()
            .setCustomId(productSelectMenuId)
            .setPlaceholder('Chọn sản phẩm ở đây.')

          for (const product of products.values()) {
            const id = product.id;
            const name = product.name;

            productSelectMenu.addOptions({
              label: name,
              description: id,
              value: id
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

          let productId = '';
          const op: UpdateOperation = {
            op: '',
            path: '',
          }

          await interaction.editReply({
            content: `Chọn sản phẩm bạn muốn chỉnh sửa.`,
            components: [
              new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(productSelectMenu)
            ]
          })

          const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === user.id,
            max: 3,
            componentType: ComponentType.StringSelect
          })

          collector.on('collect', async i => {
            const customId = i.customId;

            if (customId === productSelectMenuId) {
              await i.deferUpdate();
              productId = i.values[0];

              await interaction.editReply({
                content: `Chọn thuộc tính bạn muốn chỉnh sửa.`,
                components: [
                  new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(objectSelectMenu)
                ]
              })
            } else if (customId === objectSelectMenuId) {
              await i.deferUpdate();
              op.path = i.values[0];

              await interaction.editReply({
                content: `Chọn hành động bạn muốn thực hiện.`,
                components: [
                  new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(operationSelectMenu)
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
                        .setLabel('Giá trị:')
                        .setPlaceholder('ABC...')
                        .setStyle(TextInputStyle.Paragraph)
                        .setMaxLength(256)
                    ),
                )

              await i.showModal(modal);

              const modalSubmit = await i.awaitModalSubmit({
                filter: newI => newI.user.id === user.id && newI.customId === valueModalId,
                time: 60000 * 10
              })

              await modalSubmit.deferUpdate()
              const value = modalSubmit.fields.getTextInputValue(valueFieldId)

              if (value) op.value = value;

              await Premium.shared.updateProduct(productId, op.path as any, op.op as any, value);

              await interaction.editReply({
                components: [],
                content: `Đã chỉnh sửa sản phẩm \`${productId}\` thành công.`
              })
            }
          })
        }
      }
    })
  }
}