import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import { getTikTokVideoURL, shortenURL } from "../tiktokutil.mjs"


export let name = "reftt"
export let aliases = ["rtt"]
/**
 * 
 * @param {Message} message 
 * @param {*} args 
 * @returns 
 */
export let run = async (message, args) => {
    await message.delete()
    if(!message.reference) return message.channel.send(`${message.member}, Not a reply to a tiktok message!`)
    const ref = await message.fetchReference()
    
    if(ref.content.includes("Original TikTok post")) {
      let i1 = ref.content.lastIndexOf(" ")
      let tiktokURL = ref.content.substring(i1, ref.content.length-1)
      let videoURL = await getTikTokVideoURL(tiktokURL)
      let shortened = await shortenURL(videoURL)
      await ref.edit(`${shortened}\n[Refreshed by ${message.author}]\n[Original TikTok post: ${tiktokURL}]`)
      await ref.reply("Successfully refreshed!")
    }
    else {
      return message.channel.send(`${message.member}, Not a reply to a tiktok message!`)    
    }
}
