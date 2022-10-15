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
      let o = ref.content.split("\n")
      let originalPost = o[2]
      let tiktokURL = originalPost.substring(originalPost.indexOf("https"), originalPost.length-1)
      let videoURL = await getTikTokVideoURL(tiktokURL)
      if(videoURL == undefined) return message.channel.send("Video wasn't found!")
      let shortened = await shortenURL(videoURL)
      o[0] = shortened
      o[3] = `[Refreshed by ${message.author}]` 
      o = o.join("\n")
      let r = await message.channel.send(o)
      await r.reply("Successfully refreshed!")
    }
    else {
      return message.channel.send(`${message.member}, Not a reply to a tiktok message!`)    
    }
}
