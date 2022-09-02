const {Client, Message} = require("discord.js")
const utils = require("../util")
const {client, distube, isInBotVC} = require("../consts")


exports.name = "seek"
exports.aliases = []
exports.inVoiceChannel = true
exports.run = async (message, args) => {
    if(!isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
      distube.stop(message)
      message.channel.send('Stopped the music!')
}
