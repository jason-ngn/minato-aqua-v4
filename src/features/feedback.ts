import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { FeatureTemplate } from "icytea-command-handler";
import constants from '../constants'

export default class Feedback extends FeatureTemplate {
  public static readonly shared = new Feedback();

  public async init(client: Client<boolean>): Promise<void> { }

  public async sendFeedback(userId: string, title: string, message: string, client: Client) {
    const guild = client.guilds.cache.get(constants.defaultBotServer)!;
    const channel = guild.channels.cache.get(constants.feedbackChannelId)! as TextChannel;
    const user = client.users.cache.get(userId)!;

    const embed = new EmbedBuilder()
      .setColor(constants.embed.color)
      .setAuthor({
        name: `Phản hồi mới`
      })
      .setTitle(title || 'Không có tiêu đề')
      .setDescription(`${user} đã phản hồi như sau:\n\n${message}`)

    return await channel.send({
      embeds: [embed]
    })
  }
}