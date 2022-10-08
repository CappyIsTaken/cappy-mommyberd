import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import {client, distube, isInBotVC} from "../consts.mjs"

export let name = "queue"
export let aliases = ["q"]
export let inVoiceChannel = true
export let run = async (message, args) => {
    if(!isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
      const queue = distube.getQueue(message)
      if (!queue) {
          message.channel.send('Nothing playing right now!')
      } else {
          message.channel.send(
              `Current queue:\n${queue.songs
                  .map(
                      (song, id) =>
                          `**${id ? id : 'Playing'}**. ${
                              song.name
                          } - \`${song.formattedDuration}\``,
                  )
                  .slice(0, 10)
                  .join('\n')}`,
          )
      }
}
