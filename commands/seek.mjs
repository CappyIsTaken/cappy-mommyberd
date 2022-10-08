import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import {client, distube, isInBotVC} from "../consts.mjs"


export let name = "seek"
export let aliases = []
export let inVoiceChannel = true
export let run = async (message, args) => {
    if(!isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
      distube.stop(message)
      message.channel.send('Stopped the music!')
}
