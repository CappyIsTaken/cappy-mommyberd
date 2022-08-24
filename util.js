const {client, distube} = require("./consts")


exports.isInBotVC = (message) => {
  const authorVC = message.member?.voice?.channelId
  const botVC = distube.voices.get(message).voiceState?.channelId
  return (authorVC != null && botVC != null) && (authorVC == botVC)
}



exports.getMentionBot = () => {
    return "<@"+client.user.id+">"
}

exports.exists = (key, obj) => {
    return Object.keys(obj).includes(key)
}

exports.isMentionCommand = (message) => {
    return message.content.startsWith(getMentionBot(client))
}