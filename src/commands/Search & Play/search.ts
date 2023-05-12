import { ActionRowBuilder } from "@discordjs/builders";
import { ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { Track } from "erela.js";
import { CommandTemplate } from "icytea-command-handler";
import erela from "../..";
import { isUserInVoiceChannel } from "../../checks";
import constants from "../../constants";
import { formatDuration } from '../../functions'
import { getThumbnail } from '../../functions'

const selectMenuId = 'select-menu'
const cancelButtonId = 'cancel';

export default class Search extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'search',
        nameLocalizations: {
          vi: 'tìm-kiếm'
        },
        description: 'Tìm bài hát bằng từ khoá hoặc URL',
        options: [
          {
            name: 'query',
            nameLocalizations: {
              vi: 'từ-khoá'
            },
            description: "Từ khoá hoặc URL.",
            required: true,
            type: ApplicationCommandOptionType.String,
          }
        ]
      },
      clientPermissions: ['Connect', 'Speak'],
      checks: [isUserInVoiceChannel],
      callback: async ({
        interaction,
        options,
        guild,
        user,
        channel,
        member
      }) => {
        await interaction.deferReply();

        const query = options.getString('query', true);

        let player = erela.players.get(guild.id);

        if (!player) {
          player = erela.create({
            textChannel: channel!.id,
            voiceChannel: member.voice.channel!.id,
            guild: guild.id,
            selfDeafen: true,
            selfMute: false,
          })
        }

        const results = await erela.search({
          query,
          source: 'soundcloud',
        }, user)

        if (results.loadType === 'LOAD_FAILED') {
          return await interaction.editReply({
            content: `Không thể tìm bài hát mà bạn đã yêu cầu.`
          })
        }

        if (results.tracks.length > 25) {
          results.tracks = results.tracks.slice(0, 25);
        }

        const tracks = results.tracks;

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(selectMenuId)
          .setPlaceholder(`Chọn bài hát của bạn ở đây.`)
          .setMinValues(1)
          .setMaxValues(tracks.length)

        const cancelButton = new ButtonBuilder()
          .setCustomId(cancelButtonId)
          .setStyle(ButtonStyle.Secondary)
          .setLabel(`Huỷ tìm kiếm`)

        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];

          let title = track.title;
          let author = track.author;
          const duration = formatDuration(track.duration / 1000);

          if (title.length >= 100) {
            const titleArray = title.split(' ')
            for (let i = 0; i < 2; i++) titleArray.pop()
            titleArray.push('[...]')
            title = titleArray.join(' ')
          }

          if (author.length >= 100) {
            const authorArray = author.split(' ')
            for (let i = 0; i < 2; i++) authorArray.pop()
            authorArray.push('[...]')
            author = authorArray.join(' ')
          }

          try {
            selectMenu.addOptions({
              label: title,
              value: i.toString(),
              description: `${author} - ${duration}`
            })
          } catch (e: any) {
            console.log(e.errors)
          }
        }

        const message = await interaction.editReply({
          components: [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
            new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton)
          ],
          content: `Chọn bài hát của bạn ở dưới.`
        })

        const buttonCollector = message.createMessageComponentCollector({
          filter: i => i.user.id === user.id,
          time: 60000,
          max: 1,
          componentType: ComponentType.Button
        })

        const selectMenuCollector = message.createMessageComponentCollector({
          filter: i => i.user.id === user.id,
          time: 60000,
          max: 1,
          componentType: ComponentType.StringSelect
        })

        selectMenuCollector.on('end', async collected => {
          const first = collected.first();
          await first?.deferUpdate();

          const values = first?.values;

          if (!values?.length) {
            await message.edit({
              components: [],
              content: `Không có bài hát nào được chọn.`
            })

            return;
          }

          const tracksAdded: Track[] = []
          for (const value of values) {
            const index = parseInt(value);
            const track = tracks[index];

            tracksAdded.push(track)
            player?.queue.add(track);
          }

          const embed = new EmbedBuilder()
            .setColor(constants.embed.color)

          if (values.length === 1) {
            embed.setAuthor({
              name: `Đã thêm vào hàng đợi`
            })
              .setDescription(`[${tracksAdded[0].title}](${tracksAdded[0].uri})`)

            const thumbnail = await getThumbnail(tracksAdded[0].uri);

            if (thumbnail) embed.setThumbnail(thumbnail);
          } else {
            embed.setDescription(`Đã thêm **${values.length.toLocaleString()}** bài hát vào hàng đợi`)
          }

          await message.edit({
            components: [],
            embeds: [embed],
            content: '',
          })

          if (!player?.playing && !player?.paused) {
            player?.connect();
            await player?.play()
          }
        })

        buttonCollector.on('end', async collected => {
          const first = collected.first();

          await first?.deferUpdate();

          selectMenuCollector.stop('Cancelled');
        })
      }
    })
  }
}