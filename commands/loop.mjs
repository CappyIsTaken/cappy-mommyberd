import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import {client, distube, isInBotVC} from "../consts.mjs"


export let name = "loop"
export let aliases = ["repeat"]
export let inVoiceChannel = true
export let run = async (message, args) => {
    if(!isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
      const mode = distube.setRepeatMode(message)
      message.channel.send(
          `Set repeat mode to \`${
              mode
                  ? mode === 2
                      ? 'All Queue'
                      : 'This Song'
                  : 'Off'
          }\``,
      )
}
