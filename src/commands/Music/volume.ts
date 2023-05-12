import { ApplicationCommandOptionType } from 'discord.js';
import { CommandTemplate } from 'icytea-command-handler'
import erela from '../..'
import { isPlayerAvailable, isUserInVoiceChannel } from '../../checks'

export default class Volume extends CommandTemplate {
  constructor() {
    super({
      data: {
        name: 'volume',
        nameLocalizations: {
          vi: 'âm-lượng'
        },
        description: 'Để xem hoặc điều chỉnh âm lượng của người dùng.',
        options: [
          {
            name: 'volume',
            nameLocalizations: {
              vi: 'âm-lượng'
            },
            description: 'Âm lượng bạn muốn điều chỉnh.',
            type: ApplicationCommandOptionType.Number,
            required: false,
          }
        ]
      },
      checks: [isUserInVoiceChannel, isPlayerAvailable],
      callback: async ({
        interaction,
        guild,
        options,
      }) => {
        const player = erela.get(guild.id)!;

        const volume = options.getNumber('volume');

        if (!volume) {
          return await interaction.reply({
            content: `Âm lượng của máy phát nhạc là **${player.volume}%**.`,
            ephemeral: true,
          })
        }

        player.setVolume(volume);

        return await interaction.reply({
          content: `Âm lượng đã được điều chỉnh thành **${volume}%**.`
        })
      }
    })
  }
}