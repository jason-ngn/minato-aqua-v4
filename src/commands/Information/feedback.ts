import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import FeedbackFeature from '../../features/feedback';

const modalId = 'modal';
const titleId = 'title';
const paragraphId = 'paragraph'

export default class Feedback extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'feedback',
        nameLocalizations: {
          vi: 'phản-hổi'
        },
        description: "Phản hồi về các tính năng của bot."
      },
      callback: async ({
        interaction,
        client,
        user,
        guild,
        channel,
        options,
        member
      }) => {
        const modal = new ModalBuilder()
          .setCustomId(modalId)
          .setTitle(`Phản hồi`)
          .setComponents(
            new ActionRowBuilder<TextInputBuilder>()
              .addComponents(
                new TextInputBuilder()
                  .setCustomId(titleId)
                  .setLabel(`Tiêu đề`)
                  .setPlaceholder('VD: Bot hoạt động không hiệu quả')
                  .setRequired(false)
                  .setStyle(TextInputStyle.Short)
              ),
            new ActionRowBuilder<TextInputBuilder>()
              .addComponents(
                new TextInputBuilder()
                  .setCustomId(paragraphId)
                  .setLabel(`Nội dung`)
                  .setPlaceholder('Ghi nội dung ở đây, bạn có 10 phút.')
                  .setRequired(false)
                  .setStyle(TextInputStyle.Paragraph)
              )
          )

        await interaction.showModal(modal);

        const modalSubmit = await interaction.awaitModalSubmit({
          filter: i => i.user.id === user.id && i.customId === modalId,
          time: 60000 * 10
        })

        await modalSubmit.deferReply();
        await modalSubmit.editReply({
          content: `Đã gửi phản hồi thành công.`
        })

        const message = modalSubmit.fields.getTextInputValue(paragraphId);
        const title = modalSubmit.fields.getTextInputValue(titleId);

        await FeedbackFeature.shared.sendFeedback(user.id, title, message, client);
      }
    })
  }
}