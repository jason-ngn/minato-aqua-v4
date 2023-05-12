import { EmbedBuilder } from "discord.js";
import { CommandTemplate } from "icytea-command-handler";
import constants from "../../constants";
import { getMetadataOfCommand, getSlashCommandMention } from '../../functions'

export default class Guide extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'guide',
        nameLocalizations: {
          vi: 'hướng-dẫn-sử-dụng'
        },
        description: "Hướng dẫn sử dụng của bot."
      },
      callback: async ({ interaction, client, guild }) => {
        const instance = constants.Beta ? guild : client;

        const playCommand = getMetadataOfCommand('play', instance)
        const searchCommand = getMetadataOfCommand('search', instance)
        const pauseCommand = getMetadataOfCommand('pause', instance)
        const resumeCommand = getMetadataOfCommand('resume', instance)
        const volumeCommand = getMetadataOfCommand('volume', instance);
        const seekCommand = getMetadataOfCommand('seek', instance);
        const skipCommand = getMetadataOfCommand('skip', instance);
        const loopCommand = getMetadataOfCommand('loop', instance);
        const queueCommand = getMetadataOfCommand('queue', instance);
        const jumpCommand = getMetadataOfCommand('jump', instance);
        const removeCommand = getMetadataOfCommand('remove', instance)
        const shuffleCommand = getMetadataOfCommand('shuffle', instance);

        const play = getSlashCommandMention(playCommand.id, playCommand.name);
        const search = getSlashCommandMention(searchCommand.id, searchCommand.name);
        const pause = getSlashCommandMention(pauseCommand.id, pauseCommand.name);
        const resume = getSlashCommandMention(resumeCommand.id, resumeCommand.name);
        const volume = getSlashCommandMention(volumeCommand.id, volumeCommand.name);
        const seek = getSlashCommandMention(seekCommand.id, seekCommand.name);
        const skip = getSlashCommandMention(skipCommand.id, skipCommand.name);
        const loopReset = getSlashCommandMention(loopCommand.id, `${loopCommand.name} reset`);
        const loopQueue = getSlashCommandMention(loopCommand.id, `${loopCommand.name} queue`);
        const loopSong = getSlashCommandMention(loopCommand.id, `${loopCommand.name} song`);
        const queue = getSlashCommandMention(queueCommand.id, queueCommand.name);
        const jump = getSlashCommandMention(jumpCommand.id, jumpCommand.name);
        const remove = getSlashCommandMention(removeCommand.id, removeCommand.name);
        const shuffle = getSlashCommandMention(shuffleCommand.id, shuffleCommand.name);

        const description = `Bạn đang thắc mắc không biết cách dùng **${client.user?.username}**? Bạn không biết phải hỏi ai? Các Dev quá bận? Vậy thì bảng hướng dẫn sử dụng này sẽ giúp bạn giải đáp những thắc mắc ấy.`
        const field1 = {
          name: 'Phát nhạc',
          value: `Dùng ${play} để phát nhạc theo từ khoá bạn muốn tìm kiếm. ${play} sẽ phát bài hát đầu tiên được tìm thấy trong kết quả.\n\nDùng ${search} để tìm kiếm và phát nhạc theo từ khoá. ${search} sẽ cho bạn chọn bài hát và phát bài hát đó.`
        };
        const field2 = {
          name: 'Điều chỉnh máy phát nhạc',
          value: `Dùng ${pause}, ${resume} để dừng hoặc tiếp tục phát nhạc. ${volume} được dùng để xem hoặc điều chỉnh âm lượng của máy phát nhạc. Dùng ${seek} để, ${skip} để bỏ qua bài hát hiện tại.\n\nDùng ${loopSong} để lặp lại bài hát, ${loopQueue} để lặp lại hàng đợi, ${loopReset} để đặt lại chế độ lặp.`
        }
        const field3 = {
          name: 'Hàng đợi',
          value: `Dùng ${queue} để xem các bài hát trong hàng đợi. Dùng ${jump} để bỏ qua tới bài hát ở vị trí đã nêu. Dùng ${remove} để xoá 1 bài hát khỏi hàng đợi, ${shuffle} để xáo trộn các bài hát trong hàng đợi.`
        }

        const embed = new EmbedBuilder()
          .setColor(constants.embed.color)
          .setTitle(`Hướng dẫn sử dụng`)
          .setDescription(description)
          .addFields(
            field1,
            field2,
            field3
          )

        return await interaction.reply({
          embeds: [embed]
        })
      }
    })
  }
}