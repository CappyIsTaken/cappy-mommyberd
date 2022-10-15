export let getTiktokVideoID = async(tiktokURL) => {
    if(tiktokURL.startsWith("https://vt.tiktok.com") || tiktokURL.startsWith("https://vm.tiktok.com")) {
      let data = await fetch(tiktokURL, {
        method: "HEAD"
      })
      return await getTiktokVideoID(data.url)
    }
    const basicReg = /tiktok\.com(.*)\/video\/(\d+)/gm;
    const basicParsed = basicReg.exec(tiktokURL);
    if (basicParsed && basicParsed.length > 2) {
            return basicParsed[2];
    }
    return undefined
}


export let shortenURL = async(url) => {
    const shortener = await fetch(`https://api.shrtco.de/v2/shorten?url=${url}`)
    const dataShortener = await shortener.json()
    return dataShortener.result.full_short_link
}

export let getTikTokVideoURL = async (tiktokURL) => {
    
    const videoId = await getTiktokVideoID(tiktokURL)
    if(videoId == undefined) return undefined
    const videoData = await fetch(`https://m.tiktok.com/api/item/detail/?agent_user=&itemId=${videoId}`, {
      method: "GET",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.80 Safari/537.36",
        referer: "https://www.tiktok.com/",
        cookie: "tt_webid_v2=689854141086886123"
      }
    })
    const jsonData = await videoData.json()
    return jsonData.itemInfo.itemStruct.video.playAddr
}