import 'moment-duration-format';
import { CommandTemplate } from "icytea-command-handler";
import moment from 'moment';
import { ApplicationCommandOptionType } from 'discord.js';
import { isUserInVoiceChannel, isPlayerAvailable, doesUserHaveBasicPremium } from '../../checks'
import { formatDuration } from '../../functions'
import erela from '../..';

const fastForwardNum = 10;
const exp = /\d\d:\d\d:\d\d/g;

export default class Seek extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'seek',
        nameLocalizations: {
          vi: 'tua'
        },
        description: "Tua tới 1 thời gian nhất định của bài hát.",
        options: [
          {
            name: 'time',
            nameLocalizations: {
              vi: 'thời-gian'
            },
            description: 'Thời gian bạn muốn tua đến.',
            type: ApplicationCommandOptionType.String,
            required: false,
          }
        ]
      },
      checks: [doesUserHaveBasicPremium, isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        client,
        guild,
        options,
        channel,
        user
      }) => {
        const player = erela.players.get(guild.id)!;
        const timeToSeek = options.getString('time');

        const currentTrack = player.queue.current!;
        const currentTrackDuration = currentTrack.duration! / 1000;

        if (timeToSeek) {
          if (!timeToSeek.match(exp)) {
            return await interaction.reply({
              ephemeral: true,
              content: 'Sai cú pháp. Vui lòng dùng cú pháp: **HH:MM:SS**.'
            })
          }

          const time = moment.duration(timeToSeek).asSeconds();

          if (time < currentTrackDuration) {
            player.seek(time);

            return await interaction.reply({
              content: `Đã tua tới **${formatDuration(player.position)}**.`
            })
          } else {
            return await interaction.reply({
              ephemeral: true,
              content: `Không thể tua bài hát này.`
            })
          }
        } else {
          if ((player.position / 1000) + fastForwardNum < currentTrackDuration) {
            player.seek(player.position + (fastForwardNum * 1000));

            return await interaction.reply({
              content: `Đã tua tới **${formatDuration(player.position)}**.`
            })
          } else {
            return await interaction.reply({
              ephemeral: true,
              content: `Không thể tua bài hát này.`
            })
          }
        }
      }
    })
  }
}