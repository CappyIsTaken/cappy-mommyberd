import {Client, GatewayIntentBits, Collection} from 'discord.js'
import fs from "fs-extra"
import { SpotifyPlugin } from '@distube/spotify'
import { YtDlpPlugin } from "@distube/yt-dlp"
import { DisTube, Queue } from 'distube'
import {createClient} from "@supabase/supabase-js"
import { getTikTokVideoURL, shortenURL } from './tiktokutil.mjs'
import {execaCommand} from "execa"
import {config} from "dotenv"
import ffmpeg from "ffmpeg-static"
config()
import fetchinator from "fetch-retry"
import path from "path"


import { createRequire } from 'module'

const realFetch = fetchinator(fetch)

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


client.commands = new Collection()
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

client.on('ready', client => {
    console.log(`Logged in as ${client.user.tag}!`)
        client.user.setActivity("🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑🥑", { type: "PLAYING" });
  
})
const BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"

const TEMPLATE = {"focalTweetId":"1578164013602525186","with_rux_injections":false,"includePromotedContent":true,"withCommunity":true,"withQuickPromoteEligibilityTweetFields":true,"withBirdwatchNotes":false,"withSuperFollowsUserFields":true,"withDownvotePerspective":false,"withReactionsMetadata":false,"withReactionsPerspective":false,"withSuperFollowsTweetFields":true,"withVoice":true,"withV2Timeline":true}


function createTweetDetailPayload(tweetId) {
    const payload = {...TEMPLATE}
    payload.focalTweetId = tweetId
    return encodeURIComponent(JSON.stringify(payload))
}

async function getGuestToken() {
    const guestTokenResp = await fetch("https://api.twitter.com/1.1/guest/activate.json", {
        method: "POST",
        headers: {
            Authorization: "bearer " + BEARER_TOKEN
        }
    })
    const body = await guestTokenResp.json()
    return body.guest_token
}

async function getTweetMedia(tweetId) {
    const resp = await fetch(`https://twitter.com/i/api/graphql/zZXycP0V6H7m-2r0mOnFcA/TweetDetail?variables=${createTweetDetailPayload(tweetId)}&features=%7B%22verified_phone_label_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Afalse%2C%22unified_cards_ad_metadata_container_dynamic_card_content_query_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_uc_gql_enabled%22%3Atrue%2C%22vibe_api_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Afalse%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Afalse%2C%22interactive_text_enabled%22%3Atrue%2C%22responsive_web_text_conversations_enabled%22%3Afalse%2C%22responsive_web_enhance_cards_enabled%22%3Atrue%7D`, {
        method: "GET",
        headers: {
            authorization: "bearer " + BEARER_TOKEN,
            "x-guest-token": await getGuestToken()
        }
    })
    return (await resp.json()).data.threaded_conversation_with_injections_v2.instructions[0].entries[0].content.itemContent.tweet_results.result.legacy.extended_entities.media
}
function getVariant(variants, filter) {
    variants = variants.filter(v => !v.content_type.includes("mpeg")) 
    if(filter == "best") {
        return variants.sort((a,b) => {
            return b.bitrate - a.bitrate
        })[0]
    }
    else if(filter == "worst") {
        return variants.sort((a,b) => {
            return a.bitrate - b.bitrate
        })[0]
    }
}

async function downloadTwitterThing(URL, path) {
    const resp = await realFetch(URL, {
        retries: 5,
        retryDelay: 1000
    })
    const q = URL.indexOf("?format")
    let suffix
    if(q == -1) {
        suffix = ".mp4"
    }
    else {
        suffix = ".jpg"
    }
    resp.body.pipe(fs.createWriteStream(path + suffix))
}


async function createGrid(vid1, vid2, vid3, vid4, output) {
    let cmd = `${ffmpeg} -i ${vid1} -i ${vid2} -i ${vid3} -i ${vid4} -filter_complex "[0:v]scale=240:240[v0];[1:v]scale=240:240[v1];[2:v]scale=240:240[v2];[3:v]scale=240:240[v3];[v0][v2][v1][v3]xstack=inputs=4:layout=0_0|0_h0|w0_0|w0_h0[out];[0:a]amix=inputs=1[a];[out]fps=30[out]" -map "[out]" -map "[a]" -threads 4 -vcodec libx264 -preset veryfast -y ${output}`
    try {
        await execaCommand(cmd, {
            shell: true
        })
        for(let i = 0; i < 4; i++) {
            fs.removeSync(arguments[i].toString())
        }
        return output
    }
    catch(e) {
        console.log(e)
    }   
}

function getCurDir() {
    return process.cwd()
}

async function getFilePathByIndex(basePath, index) {
    const files = await fs.readdir(basePath)
    return path.join(basePath, files.at(index))
}

function getPathFromTweetId(tweetId) {
    return path.join(getCurDir(), tweetId)
}


async function getTwitterVideo(tweetID, mode) {
    const data = await getTweetMedia(tweetID)
    console.log(data)
    if(data.length < 4) {
        const vid = data.find(x => x.type == "video")
        if(vid) {
            return {type: "normal", "url": getVariant(vid.video_info.variants, "best").url}
        }
    }
    else if(mode == "grid" && data.length == 4) {
        await fs.mkdirp(`./${tweetID}`)
        await fs.emptyDir(`./${tweetID}`)
        let i = 0
        for(const media of data) {
            if(media.type == "video") await downloadTwitterThing(getVariant(media.video_info.variants, "worst").url, `./${tweetID}/${i}`)
            else {
                await downloadTwitterThing(media.media_url_https+"?format=jpg&name=360x360", `./${tweetID}/${i}`)
            } 
            i++
        }
        const tweetIdPath = getPathFromTweetId(tweetID.toString())
        let vid = await createGrid(await getFilePathByIndex(tweetIdPath, 0), await getFilePathByIndex(tweetIdPath, 1), await getFilePathByIndex(tweetIdPath, 2), await getFilePathByIndex(tweetIdPath, 3), path.join(tweetIdPath, `${tweetID}.mp4`))
        return {type: "custom", video: vid}
    }
  }


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
    let twitterCheck = commandName.toLowerCase().match(/(^|[^'"])(https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+))/)
    const cmd = client.commands.get(commandName.toLowerCase())
    if (twitterCheck != null && twitterCheck.length > 0) {
        let id = twitterCheck.at(4);
        try {
          await message.delete();
          const pMsg = await message.channel.send("Processing...")  
          const firstArg = args.shift()
          const vidData = await getTwitterVideo(id, firstArg)
          if(vidData == undefined) return message.channel.send("Video wasn't found!")
          if(vidData.type == "normal") {
            await message.channel.send(
                `${vidData.url}\n[Posted by ${
                  message.author
                }]\n[Original tweet: ${commandName}]\n${
                  args.length > 0 ? `[Additional body: ${args.join(" ")}]` : ""
                }`
            );
          }
          else if(vidData.type == "custom") {
            const tweetIdPath = getPathFromTweetId(id.toString())
            await message.channel.send({
              content:  `\n[Posted by ${
                  message.author
                }]\n[Original tweet: ${commandName}]`,
                files: [vidData.video]
            });
            fs.removeSync(tweetIdPath)
          }
          await pMsg.delete()
          
        }
        catch (ex) {
          if (ex.method == "DELETE" && ex.url.includes("messages")) {
            message.channel.send("Can't delete the original message!");
          }
        console.log(ex)
        }
    }
    if(commandName.includes("tiktok.com")) {
        try {
            const url = await getTikTokVideoURL(commandName)
            const shortened = await shortenURL(url)
            await message.channel.send(`${shortened}\n[Posted by ${message.author}]\n[Original TikTok post: ${commandName}]`)
            await message.delete()
        }
        catch(e) {
            console.log(e.status)
        }
       
        
    }

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
