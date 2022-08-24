const {Client, Message} = require("discord.js")
const utils = require("../util")
const {client, distube} = require("./consts")


exports.name = "leave"
exports.aliases = []

exports.run = async (message, args) => {
    if(!utils.isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
      distube.voices.get(message)?.leave()
      message.channel.send('Left the voice channel!')
}