import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import {client, distube, isInBotVC} from "../consts.mjs"
import {loginToFortnite, doMCPCommand} from "../util.mjs"
import fs from "fs-extra"


export let name = "dabmeup"
export let aliases = ["dmu"]
/**
 * 
 * @param {Message} message 
 * @param {*} args 
 * @returns 
 */
export let run = async (message, args) => {
    // if(message.guild.id != "749222916578738207") {
    //   return message.channel.send("Not berd's nest!")
    // }
    let target = message.mentions.members.at(1)
    if(!target) return message.channel.send("No user found!")
    let e1 = message.guild.emojis.cache.find(x => x.name == "creaturaleft")
    let e2 = message.guild.emojis.cache.find(x => x.name == "zahando")
    let e3 = message.guild.emojis.cache.find(x => x.name == "creaturaright")
    let e4 = message.guild.emojis.cache.find(x => x.name == "handright")
    message.channel.send(`${e2}${e1}`).then(async (msg) => {
      await msg.reply(`${target}`)
      let collector = message.channel.createMessageCollector({filter: (x) => x.member.equals(target) && x.reference.messageId == msg.id})
      collector.on("collect", async (msg2) => {
        console.log(msg2.content)
        if(msg2.content.includes(`${e3} ${e4}`) || msg2.content.includes(`${e3}${e4}`)) {
            await msg2.reply(`${e1}🤝${e3}`)
            await collector.stop()
        }
      })
      await message.delete()
    })
}
