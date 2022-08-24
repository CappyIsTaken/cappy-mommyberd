const {client, distube} = require("./consts")


export function isInBotVC(message) {
  const authorVC = message.member?.voice?.channelId
  const botVC = distube.voices.get(message).voiceState?.channelId
  return (authorVC != null && botVC != null) && (authorVC == botVC)
}



export function getMentionBot() {
    return "<@"+client.user.id+">"
}

export function exists(key, obj) {
    return Object.keys(obj).includes(key)
}

export function isMentionCommand(message) {
    return message.content.startsWith(getMentionBot(client))
}