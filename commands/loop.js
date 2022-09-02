const {Client, Message} = require("discord.js")
const utils = require("../util")
const {client, distube, isInBotVC} = require("../consts")


exports.name = "loop"
exports.aliases = ["repeat"]
exports.inVoiceChannel = true
exports.run = async (message, args) => {
    if(!isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
      const mode = distube.setRepeatMode(message)
      message.channel.send(
          `Set repeat mode to \`${
              mode
                  ? mode === 2
                      ? 'All Queue'
                      : 'This Song'
                  : 'Off'
          }\``,
      )
}
