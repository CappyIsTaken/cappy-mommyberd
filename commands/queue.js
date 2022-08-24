const {Client, Message} = require("discord.js")
const utils = require("../util")
const {client, distube} = require("./consts")


exports.name = "queue"
exports.aliases = ["q"]

exports.run = async (message, args) => {
    if(!utils.isInBotVC(message)) {
        message.channel.send("You aren't in the same voice channel as the bot!")
        return
      } 
      const queue = distube.getQueue(message)
      if (!queue) {
          message.channel.send('Nothing playing right now!')
      } else {
          message.channel.send(
              `Current queue:\n${queue.songs
                  .map(
                      (song, id) =>
                          `**${id ? id : 'Playing'}**. ${
                              song.name
                          } - \`${song.formattedDuration}\``,
                  )
                  .slice(0, 10)
                  .join('\n')}`,
          )
      }
}
