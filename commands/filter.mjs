import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import {client, distube, isInBotVC, exists} from "../consts.mjs"

export let name = "filter"
export let aliases = []
export let inVoiceChannel = true

export let run = async (message, args) => {
    let queue = distube.getQueue(message)
    if(!queue) {
      message.channel.send("Nothing is playing!")
      return
    }
    let filter = args.shift()
    if(filter == "off" && queue.filters.size) {
      queue.filters.clear()
      return
    }
    if(exists(filter, distube.filters)) {
        if(queue.filters.has(filter)) queue.filters.remove(filter)
        else queue.filters.add(filter)
    }
    else {
      return message.channel.send("This filter doesn't exist!")
    }

    message.channel.send(`Current queue filters: ${queue.filters.names.join(",")}`)

}
