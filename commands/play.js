const {Client, Message} = require("discord.js")
const {client, distube} = require("./consts")

exports.name = "play"
exports.aliases = ["p"]

exports.run = async (message, args) => {
    const voiceChannel = message.member?.voice?.channel
        if (voiceChannel) {
            await distube.play(voiceChannel, args.join(' '), {
                message,
                textChannel: message.channel,
                member: message.member,
            })
        } else {
            message.channel.send(
                'You must join a voice channel first.',
            )
        }
}