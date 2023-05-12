import { EmbedBuilder } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import constants from "../../constants";
import { pagination } from "../../functions";

export default class Servers extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'servers',
        nameLocalizations: {
          vi: 'máy-chủ'
        },
        description: "Để xem các máy chủ mà bot có mặt."
      },
      ownerOnly: true,
      callback: async ({
        interaction,
        client,
        guild,
        user,
        member,
        channel,
        options
      }) => {
        const message = await interaction.deferReply({
          fetchReply: true,
        });

        const guilds = client.guilds.cache.sort((a, b) => b.members.cache.size - a.members.cache.size).map(s => s);

        const generateEmbed = async (start: number) => {
          const servers = guilds.slice(start, start + 5);

          const embed = new EmbedBuilder()
            .setColor(constants.embed.color)
            .setTitle(`Danh sách máy chủ`)

          if (!servers.length) {
            embed.setDescription(`Không có máy chủ.`)
          } else {
            embed.setDescription(`${guilds.length.toLocaleString('vi')} máy chủ.`)

            for (let i = 0; i < servers.length; i++) {
              const server = servers[i];

              embed.addFields(
                {
                  name: `Tên máy chủ:`,
                  value: server.name,
                  inline: true,
                },
                {
                  name: `Số thành viên:`,
                  value: server.memberCount.toLocaleString('vi'),
                  inline: true,
                },
                {
                  name: `Tên chủ:`,
                  value: `${server.members.cache.get(server.ownerId)}`,
                  inline: true,
                }
              )
            }
          }

          return embed;
        }

        const canFitOnOnePage = guilds.length <= 5;

        return await pagination(message, generateEmbed, canFitOnOnePage, guilds, interaction, client, 5)
      }
    })
  }
}