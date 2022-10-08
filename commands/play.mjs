import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import {client, distube, isInBotVC} from "../consts.mjs"
export let name = "play"
export let aliases = ["p"]
export let inVoiceChannel = false
export let run = async (message, args) => {
    const voiceChannel = message.member?.voice?.channel
        if (voiceChannel) {
            await distube.play(voiceChannel, args.join(' '), {
                message,
                textChannel: message.channel,
                member: message.member,
                skip: false,
            })
        } else {
            message.channel.send(
                'You must join a voice channel first.',
            )
        }
}