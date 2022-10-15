
import { getFileByIndex, relToAbs } from "./fileutils.mjs"


const BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"

const TEMPLATE = {"focalTweetId":"1578164013602525186","with_rux_injections":false,"includePromotedContent":true,"withCommunity":true,"withQuickPromoteEligibilityTweetFields":true,"withBirdwatchNotes":false,"withSuperFollowsUserFields":true,"withDownvotePerspective":false,"withReactionsMetadata":false,"withReactionsPerspective":false,"withSuperFollowsTweetFields":true,"withVoice":true,"withV2Timeline":true}


export function createTweetDetailPayload(tweetId) {
    const payload = {...TEMPLATE}
    payload.focalTweetId = tweetId
    return encodeURIComponent(JSON.stringify(payload))
}

export async function getGuestToken() {
    const guestTokenResp = await fetch("https://api.twitter.com/1.1/guest/activate.json", {
        method: "POST",
        headers: {
            Authorization: "bearer " + BEARER_TOKEN
        }
    })
    const body = await guestTokenResp.json()
    return body.guest_token
}

export async function getTweetMedia(tweetId) {
    const resp = await fetch(`https://twitter.com/i/api/graphql/zZXycP0V6H7m-2r0mOnFcA/TweetDetail?variables=${createTweetDetailPayload(tweetId)}&features=%7B%22verified_phone_label_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Afalse%2C%22unified_cards_ad_metadata_container_dynamic_card_content_query_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_uc_gql_enabled%22%3Atrue%2C%22vibe_api_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Afalse%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Afalse%2C%22interactive_text_enabled%22%3Atrue%2C%22responsive_web_text_conversations_enabled%22%3Afalse%2C%22responsive_web_enhance_cards_enabled%22%3Atrue%7D`, {
        method: "GET",
        headers: {
            authorization: "bearer " + BEARER_TOKEN,
            "x-guest-token": await getGuestToken()
        }
    })
    return (await resp.json()).data.threaded_conversation_with_injections_v2.instructions[0].entries[0].content.itemContent.tweet_results.result.legacy.extended_entities.media
}
export function getVariant(variants, filter) {
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
    let str = ""
    let c = 0
    for(let i = 0; i < 4; i++) {
        if(arguments[i].toString().endsWith(".mp4")) {
            str += `[${i}:a]`
            c++
        }
    }
    let cmd = `${ffmpeg} -i ${vid1} -i ${vid2} -i ${vid3} -i ${vid4} -filter_complex "[0:v]scale=240:240[v0];[1:v]scale=240:240[v1];[2:v]scale=240:240[v2];[3:v]scale=240:240[v3];[v0][v2][v1][v3]xstack=inputs=4:layout=0_0|0_h0|w0_0|w0_h0[out];${c > 0 ? `${str}amix=inputs=${c}[a]` : ""};[out]fps=30[out]" -map "[out]" -map "[a]" -threads 4 -vcodec libx264 -preset veryfast -y ${output}`
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



export async function getTwitterVideo(tweetID, mode) {
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
        const tweetIdPath = relToAbs(tweetID.toString())
        let vid = await createGrid(await getFileByIndex(tweetIdPath, 0), await getFileByIndex(tweetIdPath, 1), await getFileByIndex(tweetIdPath, 2), await getFileByIndex(tweetIdPath, 3), path.join(tweetIdPath, `${tweetID}.mp4`))
        return {type: "custom", video: vid}
    }
}