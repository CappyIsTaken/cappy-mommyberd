import {Client, GatewayIntentBits, Collection} from 'discord.js'
import fs from "fs-extra"
import { SpotifyPlugin } from '@distube/spotify'
import { YtDlpPlugin } from "@distube/yt-dlp"
import { DisTube, Queue } from 'distube'
import {createClient} from "@supabase/supabase-js"
import {config} from "dotenv"
config()

export let client = new Client({
    intents: [
       GatewayIntentBits.GuildMessages,
       GatewayIntentBits.GuildVoiceStates,
       GatewayIntentBits.GuildMembers,
       GatewayIntentBits.Guilds,
       GatewayIntentBits.GuildMessageTyping,
       GatewayIntentBits.MessageContent,
       GatewayIntentBits.DirectMessages
    ],
})

const commands = new Collection()
const handlers = new Collection()

client.commands = commands
client.interceptors = handlers
export async function setupCommands () {
    const commands = fs.readdirSync("./commands").filter(file => file.endsWith(".mjs"))
    for(const commandFile of commands) {
        const command = await import(`./commands/${commandFile}`)
        console.log(`Attempting to init: ${commandFile}`)
        client.commands.set(command.name, command)
        console.log(`Added ${command.name} to the command list!`)
        for(const alias of command.aliases) {
            client.commands.set(alias, command)
            console.log(`Added ${alias} as ${command.name} to the command list!`)
        }
    }
}

export async function setupHandlers () {
    const handlers = fs.readdirSync("./url-handlers").filter(file => file.endsWith(".mjs"))
    for(const handler of handlers) {
        const command = await import(`./url-handlers/${handler}`)
        const name = handler.slice(0, handler.indexOf(".mjs"))
        console.log(`Attempting to init handler: ${handler}`)
        client.interceptors.set(name, command)
        console.log(`Added ${name} to the handlers list!`)
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
    else if(isMentionCommand(message)) {
        args = message.content.slice(getBotMention().length).trim().split(/ +/g)
    }
    else {
        return
    }
    commandName = args.shift()
    const handler = handlers.find((x) => x.predicate(commandName) != null && x.predicate(commandName))
    if(handler) {
        const msg = await message.channel.send("Processing...")
        await handler.run(message, commandName, args)
        await msg.delete()
        return
    }
    const cmd = client.commands.get(commandName.toLowerCase())
    if(!cmd) return
    await cmd.run(message, args)
})

export let distube = new DisTube(client, {
    searchSongs: 5,
    searchCooldown: 30,
    leaveOnEmpty: true,
    leaveOnFinish: false,
    leaveOnStop: false,
    plugins: [new YtDlpPlugin(), new SpotifyPlugin()]
})


export function isInBotVC (message) {
    const authorVC = message.member?.voice?.channelId
    const botVC = distube.voices.get(message).voiceState?.channelId
    return (authorVC != null && botVC != null) && (authorVC == botVC)
}
  
  
  
export function getBotMention () {
      return "<@"+client.user.id+">"
  }
  
export function exists (key, obj) {
      return Object.keys(obj).includes(key)
  }
  
export function isMentionCommand(message) {
      return message.content.startsWith(getBotMention())
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

export let supabaseClient = createClient("https://yxhtmjdsrrynfpvngbet.supabase.co", process.env.SUPABASE_KEY)
