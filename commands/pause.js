const {Client, Message} = require("discord.js")
const utils = require("../util")
const {client, distube, isInBotVC} = require("../consts")


exports.name = "pause"
exports.aliases = []

exports.run = async (message, args) => {
    if(!isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
    distube.pause(message)
}
