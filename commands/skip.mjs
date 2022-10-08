import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import {client, distube, isInBotVC} from "../consts.mjs"

export let name = "skip"
export let aliases = []
export let inVoiceChannel = true
export let run = async (message, args) => {
    if(!isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
    const q = distube.getQueue(message)
    q.autoplay = false
    if(q)
    {
      if(q.songs.length > 1)
        distube.skip(message)
      else q.stop()
      message.channel.send("Skipped!")
    }
    else {
      message.channel.send("No queue available!")
    }
}
