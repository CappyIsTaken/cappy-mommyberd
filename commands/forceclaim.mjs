import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import {client, distube, isInBotVC} from "../consts.mjs"
import * as utils from "../util.mjs"

export let name = "forceclaim"
export let aliases = []
export let run = async (message, args) => {
    message.channel.send("Processing request...").then(async msg => {
      try {
        await utils.claimDailyRewards()
        await msg.delete()
        await msg.channel.send("Finished claiming!")
      }
      catch(ex) {
        await msg.channel.send("An error has occurred!")
      }
      
    })
    
}
