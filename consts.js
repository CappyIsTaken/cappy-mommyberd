const {Client, GatewayIntentBits, Collection, Utils} = require('discord.js')
const fs = require("fs")
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { SpotifyPlugin } = require('@distube/spotify')
const { YtDlpPlugin } = require("@distube/yt-dlp")
const { DisTube, Queue } = require('distube')

let client = new Client({
    intents: [
       GatewayIntentBits.GuildMessages,
       GatewayIntentBits.GuildVoiceStates,
       GatewayIntentBits.GuildMembers,
       GatewayIntentBits.Guilds,
       GatewayIntentBits.GuildMessageTyping,
       GatewayIntentBits.MessageContent
    ],
})


exports.client = client
client.commands = new Collection()
exports.setupCommands = () => {
    const commands = fs.readdirSync("./commands").filter(file => file.endsWith(".js"))
    for(const commandFile of commands) {
        const command = require(`./commands/${commandFile}`)
        console.log(`Attempting to init: ${commandFile}`)
        client.commands.set(command.name, command)
        console.log(`Added ${command.name} to the command list!`)
        for(const alias of command.aliases) {
            client.commands.set(alias, command)
            console.log(`Added ${alias} as ${command.name} to the command list!`)
        }
    }
}

client.on('ready', client => {
    console.log(`Logged in as ${client.user.tag}!`)
        client.user.setActivity("🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑", { type: "PLAYING" });
  
})

client.on('messageCreate', async message => {
    if (message.author.bot || !message.inGuild()) return
  let args
  let commandName
    if (message.content.startsWith(process.env.prefix)) {
         args = message.content
        .slice(process.env.prefix.length)
        .trim()
        .split(/ +/g)
          
    }
    else if(this.isMentionCommand(message)) {
        args = message.content.slice(this.getMentionBot().length).trim().split(/ +/g)
    }
    else {
        return
    }
    commandName = args.shift().toLowerCase()
    let twitterCheck = commandName.match(/(^|[^'"])(https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+))/)
    const cmd = client.commands.get(commandName)
    if(twitterCheck != null && twitterCheck.length > 0) {

        let id = twitterCheck.at(4)
  try{
      let resp = await fetch(`https://cdn.syndication.twimg.com/tweet?id=${id}`)
    let data = await resp.json();
    if(data.video) {
      let variants = data.video.variants.filter(x => !x.type.includes("mpeg"))
      let sorted = variants.sort((a,b) => {
        let res1 = a.src.substring(a.src.indexOf("x", 26)+1, a.src.lastIndexOf("/"))
        let res2 = b.src.substring(b.src.indexOf("x", 26)+1, b.src.lastIndexOf("/"))
        return parseInt(res2)-parseInt(res1)
      })
      await message.channel.send(sorted[0].src+`\n[Posted by ${message.author}]\n[Original tweet: ${commandName}]\n${args.length > 0 ? `[Additional body: ${args.join(" ")}]` : ""}`)
      await message.delete()
    }
  }catch(ex){
      if(ex.method == "DELETE" && ex.url.includes("messages")) {
        message.channel.send("Can't delete the original message!")
      }
  }
    }
    if(!cmd) return
    await cmd.run(message, args)
})

let distube = new DisTube(client, {
    searchSongs: 5,
    searchCooldown: 30,
    leaveOnEmpty: true,
    leaveOnFinish: false,
    leaveOnStop: false,
    plugins: [new YtDlpPlugin(), new SpotifyPlugin()]
})
exports.distube = distube


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
      return message.content.startsWith(this.getMentionBot())
  }



const status = queue =>
    `Volume: \`${queue.volume}%\` | Filter: \`${
        queue.filters.join(', ') || 'Off'
    }\` | Loop: \`${
        queue.repeatMode
            ? queue.repeatMode === 2
                ? 'All Queue'
                : 'This Song'
            : 'Off'
    }\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``
distube
    .on('playSong', (queue, song) => {
      if(queue.repeatMode != 0) {
        queue.textChannel?.send(
            `Playing \`${song.name}\` - \`${
                song.formattedDuration
            }\`\nRequested by: ${song.user}\n${status(queue)}`,
        )
      }
    
    })
    .on('addSong', (queue, song) =>
        queue.textChannel?.send(
            `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`,
        ),
    )
    .on('addList', (queue, playlist) =>
        queue.textChannel?.send(
            `Added \`${playlist.name}\` playlist (${
                playlist.songs.length
            } songs) to queue\n${status(queue)}`,
        ),
    )
    .on('error', (textChannel, e) => {
        console.error(e)
        textChannel.send(
            `An error encountered: ${e.message.slice(0, 2000)}`,
        )
    })
    .on('finish', queue => queue.textChannel?.send('Finish queue!'))
    .on('disconnect', queue =>
        queue.textChannel?.send('Left channel!'),
    )
    .on("empty", queue =>
        queue.textChannel?.send(
            'The voice channel is empty! Leaving the voice channel...'
        )
    
    )
    // DisTubeOptions.searchSongs > 1
    .on('searchResult', (message, result) => {
        let i = 0
        message.channel.send(
            `**Choose an option from below**\n${result
                .map(
                    song =>
                        `**${++i}**. ${song.name} - \`${
                            song.formattedDuration
                        }\``,
                )
                .join(
                    '\n',
                )}\n*Enter anything else or wait 30 seconds to cancel*`,
        )
    })
    .on('searchCancel', message =>
        message.channel.send('Searching canceled'),
    )
    .on('searchInvalidAnswer', message =>
        message.channel.send('Invalid number of result.'),
    )
    .on('searchNoResult', message =>
        message.channel.send('No result found!'),
    )
    .on('searchDone', () => {})





