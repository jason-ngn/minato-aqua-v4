import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandSubGroupData, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import path from "path";
import constants from '../../constants'
import emoji from "../../emoji";
import { getAllGroups, getCommandsInGroup, getMetadataOfCommand } from "../../functions";

const selectMenuId = 'select-menu';
const backId = "back";
const forwardId = "forward";
const deleteId = "delete";

export default class Help extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'help',
        nameLocalizations: {
          vi: 'trợ-giúp'
        },
        description: "Trợ giúp về cách dùng bot.",
        options: [
          {
            name: 'command',
            nameLocalizations: {
              vi: 'lệnh'
            },
            description: "Lệnh bạn muốn tìm hiểu thêm.",
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true,
          }
        ]
      },
      async autocompleteFunction(interaction, focusedArgument, handler) {
        const commands = handler.commands;

        if (focusedArgument.name === 'command') {
          if (!focusedArgument.value.length) {
            return commands.map(command => ({
              name: command.data.name,
              value: command.data.name,
            }))
          }

          const specificCommands = commands.filter(command => command.data.name.toLowerCase().match(new RegExp(`(${focusedArgument.value.toLowerCase()})`, 'g')));
          if (!specificCommands || !specificCommands.size) return;

          return specificCommands.map(command => ({
            name: command.data.name,
            value: command.data.name
          }))
        }
      },
      callback: async ({
        interaction,
        client,
        guild,
        options,
        channel,
        user,
        member,
        handler
      }) => {
        const message = await interaction.deferReply({
          fetchReply: true,
        });

        let command = options.getString('command')

        if (command) {
          command = command.toLowerCase();
          const validCommand = handler.commands.get(command);

          if (!validCommand) {
            return await interaction.editReply({
              content: `Lệnh **${command}** không tồn tại.`
            })
          }

          const embed = new EmbedBuilder()
            .setColor(constants.embed.color)
            .setTitle(`/${validCommand.data.name}`)
            .setDescription(validCommand.data.description)
            .addFields(
              {
                name: 'Quyền của người dùng:',
                value: validCommand.userPermissions && validCommand.userPermissions.length ?
                  validCommand.userPermissions.map(perm => `\`${perm}\``).join(' ') :
                  `Không có quyền hạn cần thiết.`
              },
              {
                name: 'Quyền của bot:',
                value: validCommand.clientPermissions && validCommand.clientPermissions.length ?
                  validCommand.clientPermissions.map(perm => `\`${perm}\``).join(' ') :
                  `Không có quyền hạn cần thiết.`
              }
            )

          return await interaction.editReply({
            embeds: [embed]
          })
        }

        const groups = getAllGroups(path.join(__dirname, '../../commands'));
        const curvedLine = client.emojis.cache.get(emoji.curvedLine);

        const embed = new EmbedBuilder()
          .setColor(constants.embed.color)
          .setTitle(`Bảng trợ giúp`)
          .setDescription(`Chọn nhóm lệnh bên dưới để xem tất cả lệnh trong nhóm đó.`)

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(selectMenuId)
          .setPlaceholder(`Chọn nhóm lệnh ở đây.`)
          .setOptions(groups.map(group => ({
            label: group,
            description: `${getCommandsInGroup(
              path.join(__dirname, '../../commands', group)
            ).length.toLocaleString('vi')
              } lệnh.`,
            value: group,
          })))

        const backButton = new ButtonBuilder()
          .setCustomId(backId)
          .setEmoji(client.emojis.cache.get(emoji.back)!.identifier)
          .setStyle(ButtonStyle.Primary)

        const forwardButton = new ButtonBuilder()
          .setCustomId(forwardId)
          .setEmoji(client.emojis.cache.get(emoji.forward)!.identifier)
          .setStyle(ButtonStyle.Primary)

        const deleteButton = new ButtonBuilder()
          .setCustomId(deleteId)
          .setEmoji(client.emojis.cache.get(emoji.trashCan)!.identifier)
          .setStyle(ButtonStyle.Secondary)

        await interaction.editReply({
          embeds: [embed],
          components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
              .addComponents(selectMenu)
          ]
        })

        const collector = message.createMessageComponentCollector({
          time: 60000,
          filter: i => i.user.id === user.id,
        })

        let currentIndex = 0;
        let currentGroup: CommandTemplate[];
        let canFitOnOnePage: boolean;

        collector
          .on('collect', async i => {
            await i.deferUpdate()

            const generateEmbed = async (commands: CommandTemplate[], start: number) => {
              const commandsSliced = commands
                .map(c => c)
                .slice(start, start + 10);
              const commandsArray: string[] = [];

              loop1: for (const command of commandsSliced) {
                const cmdInfo = getMetadataOfCommand(command.data.name, constants.Beta ? guild : client);

                if (
                  !cmdInfo.options ||
                  !cmdInfo.options.length ||
                  cmdInfo.options.some(
                    cmd =>
                      ![
                        ApplicationCommandOptionType.Subcommand,
                        ApplicationCommandOptionType.SubcommandGroup
                      ].includes(cmd.type)
                  )
                ) {
                  commandsArray.push(`</${cmdInfo.name}:${cmdInfo.id}>\n${curvedLine} ${cmdInfo.description}`)
                }
                let subcommand = false;
                let info: any[] = cmdInfo.options;
                let cmdString = cmdInfo.name;

                loop2: while (subcommand === false) {
                  info = info.filter(option => {
                    return [
                      ApplicationCommandOptionType.Subcommand,
                      ApplicationCommandOptionType.SubcommandGroup
                    ].includes(option.type)
                  })

                  if (!info || !info.length) continue loop1

                  if (info.some(i => i.type === ApplicationCommandOptionType.Subcommand)) {
                    for (const i of info) {
                      commandsArray.push(`</${cmdString} ${i.name}:${cmdInfo.id}>\n${curvedLine} ${i.description}`)
                    }
                    subcommand = true;
                  }

                  if (info[0].options) {
                    info = (info[0] as ApplicationCommandSubGroupData).options!;
                    continue loop2
                  }
                }
              }

              const embed = new EmbedBuilder()
                .setColor(constants.embed.color)
                .setDescription(commandsArray.join('\n'))

              return embed;
            }

            if (i.isStringSelectMenu() && i.customId === selectMenuId) {
              const groupName = i.values[0];
              currentGroup = getCommandsInGroup(path.join(__dirname, '../../commands', groupName))
              canFitOnOnePage = currentGroup.length <= 10;

              await interaction.editReply({
                embeds: [(await generateEmbed(currentGroup, currentIndex))!],
                components: canFitOnOnePage ?
                  [
                    new ActionRowBuilder<StringSelectMenuBuilder>()
                      .addComponents(StringSelectMenuBuilder.from(selectMenu))
                  ] : [
                    new ActionRowBuilder<StringSelectMenuBuilder>()
                      .addComponents(StringSelectMenuBuilder.from(selectMenu)),
                    new ActionRowBuilder<ButtonBuilder>()
                      .addComponents(
                        backButton.setDisabled(true),
                        deleteButton,
                        forwardButton,
                      )
                  ]
              })
            } else if (i.isButton() && [backId, deleteId, forwardId].includes(i.customId)) {
              if (i.customId === deleteId) {
                collector.stop();
                return;
              }

              i.customId === backId ?
                (currentIndex -= 10) :
                (currentIndex += 10);

              await interaction.editReply({
                embeds: [(await generateEmbed(currentGroup, currentIndex))!],
                components: [
                  new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(StringSelectMenuBuilder.from(selectMenu)),
                  new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                      ...(
                        currentIndex ?
                          [
                            ButtonBuilder.from(backButton).setDisabled(false)
                          ] :
                          [
                            ButtonBuilder.from(backButton).setDisabled(true)
                          ]
                      ),
                      ButtonBuilder.from(deleteButton),
                      ...(
                        currentIndex + 10 < currentGroup.length ?
                          [
                            ButtonBuilder.from(forwardButton).setDisabled(false)
                          ] :
                          [
                            ButtonBuilder.from(forwardButton).setDisabled(true)
                          ]
                      )
                    )
                ]
              })
            }
          })
          .on('end', async i => {
            await message.edit({
              components: canFitOnOnePage ? [
                new ActionRowBuilder<StringSelectMenuBuilder>()
                  .addComponents(
                    StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
                  ),
              ] : [
                new ActionRowBuilder<StringSelectMenuBuilder>()
                  .addComponents(
                    StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
                  ),
                new ActionRowBuilder<ButtonBuilder>()
                  .addComponents(
                    ButtonBuilder.from(backButton).setDisabled(true),
                    ButtonBuilder.from(deleteButton).setDisabled(true),
                    ButtonBuilder.from(forwardButton).setDisabled(true)
                  )
              ]
            })
          })
      }
    })
  }
}