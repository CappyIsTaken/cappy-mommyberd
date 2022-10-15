
import { getTikTokVideoURL, shortenURL } from "../tiktokutil.mjs"



export const predicate = (url) => {
    return url.includes("tiktok.com")
}

export const run = async (message, url, args) => {
    console.log(url)
    try {
        const tiktokVideo = await getTikTokVideoURL(url)
        const shortened = await shortenURL(tiktokVideo)
        await message.channel.send(`${shortened}\n[Posted by ${message.author}]\n[Original TikTok post: ${url}]`)
        await message.delete()
    }
    catch(e) {
        console.log(e.status)
    }
}