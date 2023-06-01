import { ColorResolvable } from 'discord.js'
import { NodeType } from './types'

class Constants {
  readonly Token = 'MTAwMjQ2NDI1MTExMTI3NjYwOQ.GbHizS.d1f26kF2b4nEaRNvbgQ0ytoSEOq7h9Cx3t7eHU'
  readonly BetaToken = 'OTk4ODY3NDc1NjYxODU2Nzg5.G4p6HP.8fToXJMrC7byBxtXknXQ-gUH6LAMSJwGEFqsos'
  readonly Beta = process.env.BETA === 'TRUE' ? true : false
  readonly MongoURL = 'mongodb+srv://Jason:620521@icybot.bcikm.mongodb.net/Minato-Aqua-V4?retryWrites=true&w=majority'
  // readonly MongoURL = ''
  readonly owners = ["754982406393430098", "752196368004677634", "873990163422916719"]
  readonly TestServers = ["773477649174626344", "910524368545792040"]
  readonly links = {
    supportServer: "https://discord.gg/yeBsq92phE",
    botInviteLink: "https://discord.com/api/oauth2/authorize?client_id=866645500898836480&permissions=8&scope=bot%20applications.commands",
    botVoteLink: "https://top.gg/bot/866645500898836480/vote",
    easterEggImageLink: "https://media.discordapp.net/attachments/914503853104320552/917350668270960660/FB_IMG_1638783319328.jpg",
  }
  readonly translationsAdminId = "754982406393430098"
  readonly easterEggMinNumber = 1
  readonly easterEggMaxNumber = 1000
  readonly easterEggWinNumber = 222
  readonly embed = {
    color: "#2E3135" as ColorResolvable,
    wrongcolor: "#2E3135",
    footertext: "Thank you for choosing Minato Aqua!",
    footericon: "https://cdn.discordapp.com/emojis/759400407847141396.png?v=1&size=40",
    banner: "https://cdn.discordapp.com/emojis/759400407847141396.png?v=1&size=40",
    nosongbanner: "https://cdn.discordapp.com/emojis/759400407847141396.png?v=1&size=40",
    avatara: "https://cdn.discordapp.com/emojis/743203194686931025.gif?v=1&size=40",
    embedplay: "https://cdn.discordapp.com/emojis/617778618541670540.gif?v=1&size=40",
    slashCommandsInstruction: "https://cdn.discordapp.com/attachments/916377001156308992/943770264683032586/slash-commands-help.gif"
  }
  readonly cmdLogChannel = '914511410623578112'
  readonly defaultBotServer = '910524368545792040'
  readonly feedbackChannelId = '940898756931502101';
  readonly serversStatusChannel = '914510901422477312'
  readonly genius = {
    clientSecret: 'XZ0xZ67TlW0scTyxcBaoEn86PSAHHv-FMX7sInso75btrZ81IdzvEoMryVdgo6SFn6LCoyqhp8fLO4BhpD7YEw',
    accessToken: 'H62TaV3dD7s7aEq1GeW7MH4aD3w4zP7mx5lETQ2y5vBN9lhUR1d9-pvOb6GopIOO'
  }
  readonly Nodes = [
    {
      host: "narco.buses.rocks",
      name: 'narco.buses.rocks',
      port: 2269,
      password: "glasshost1984",
      secure: false
    },
  ] as NodeType[];
  readonly favoritesPlaylistName = 'Yêu thích'
  readonly paypalConfig = {
    sandbox: {
      clientId: 'Ada3x_YFphP67rKVDl0OEO3kJlengDkdBZHzKUbZbbXF6Md7ei4foxHjOoJB72NW6KJFYnX_Yc5oTwDb',
      secretKey: 'EDEmg1I0DnvJX03czFOPjekwxerpuojFJPc0nj2E7ABiasT9cCdW2OfSNxmO4K2fRP_Nc7NrWl3iv7S0'
    },
    live: {
      clientId: 'AaKGqim7oW2ow8NufR05fpE-ejRllUzMwGCz3EdkB7_tYYms8E_gKz1vYK6rsspFDdZUz7HRuyMt1rSs',
      secretKey: 'EJjgd_T9UK6PtUlk1xlSic9IAU0bnUy4UByAXkAl3t0ZRNi2MrEEBCSP7feC78H3ES3LltysYTZUw3ga'
    }
  }
  readonly port = process.env.PORT ? parseInt(process.env.PORT) : 4296;
  readonly baseURL = this.Beta === false ? `https://zeus.daki.cc:${this.port}` : `http://localhost:${this.port}`
}

export default new Constants