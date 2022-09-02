const {Client, Message} = require("discord.js")
const utils = require("../util")
const {client, distube, isInBotVC} = require("../consts")


exports.name = "skip"
exports.aliases = []
exports.inVoiceChannel = true
exports.run = async (message, args) => {
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
