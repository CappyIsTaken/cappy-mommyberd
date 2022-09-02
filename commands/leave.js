const {Client, Message} = require("discord.js")
const {client, distube, isInBotVC} = require("../consts")


exports.name = "leave"
exports.aliases = []
exports.inVoiceChannel = true
exports.run = async (message, args) => {
    if(!isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
      distube.voices.get(message)?.leave()
      message.channel.send('Left the voice channel!')
}
