import {supabaseClient} from "./consts.mjs"
import fetchinator from "fetch-retry"

const newFetch = fetchinator(fetch)


export let killAccessToken = async (access_token) => {

    const resp = await newFetch(`https://account-public-service-prod.ol.epicgames.com/account/api/oauth/sessions/kill/${access_token}`, {
        method: "DELETE",
        headers: {
            Authorization: "bearer " + access_token
        },
        retries: 3,
        retryDelay: 1000
    })
    if(resp.status == 204) console.log("Successfully deleted access token: " + access_token)
    return resp
}


export let doMCPCommand = async (mcpCommand, profile, accData, bodyStr, shouldKillToken = false) => {
    try {
        const resp = await fetch(`https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/profile/${accData.account_id}/client/${mcpCommand}?profileId=${profile}&rvn=-1`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + accData.access_token,
        },
        body: bodyStr
    })
    if(shouldKillToken) {
        await this.killAccessToken(accData.access_token)
    }
    return await resp.json()
    }
    catch(ex) {
        return ex
    }
    
}

export let getDiscordIds = async () => {
    return (await supabaseClient.from("accounts").select("id")).data.map(x => x.id)
}

export let claimDailyReward = async (discord_id, acc_data) => {
    const resp = await this.doMCPCommand("ClaimLoginReward", "campaign", acc_data, "{}", true)
    const dailyRewardData = await resp.json()
    const itemData = dailyRewardData.notifications[0]
    if(itemData.items.length > 0) {
        const {data,error} = await supabaseClient.from("accounts").update({last_reward: JSON.stringify(itemData)}).eq("id", discord_id)
        return itemData
    }
    else {
        const {data, error} = await supabaseClient.from("accounts").select().eq("id", discord_id)
        if(data) {
            return JSON.parse(data[0].last_reward)
        }
    }
    
}

function createLoginPayload(accData) {
    let urlData = new URLSearchParams()
    urlData.append("grant_type", "device_auth")
    urlData.append("account_id", accData.account_id)
    urlData.append("secret", accData.secret)
    urlData.append("device_id", accData.device_id)
    return urlData
}


export let loginToFortnite = async (discord_id) => {
    const {data, error} = await supabaseClient.from("accounts").select().eq("id", discord_id)
    if(!data || data.length <= 0) return undefined
    let accData = data[0]
    console.log(accData, error)
    if(accData) {
        const response = await fetch("https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "basic M2Y2OWU1NmM3NjQ5NDkyYzhjYzI5ZjFhZjA4YThhMTI6YjUxZWU5Y2IxMjIzNGY1MGE2OWVmYTY3ZWY1MzgxMmU="
            },
            body: createLoginPayload(accData)
        })
        const jsonResp = await response.json()
        return {...jsonResp, discordId: discord_id}
    }
}

export let getDisplayName = async (dailyRewardData) => {
    if(dailyRewardData.items[0].itemType.includes("mtx")) {
        return "V-Bucks"
    }
    const rewardRow = (dailyRewardData.daysLoggedIn%335)-2
    const dailyRewardTable = await fetch("https://fortnitecentral.gmatrixgames.ga/api/v1/export?path=FortniteGame/Plugins/GameFeatures/SaveTheWorld/Content/Balance/DataTables/DailyRewards")
    const dailyRewardJson = await dailyRewardTable.json()
    const rewardRowObject = dailyRewardJson.jsonOutput[0].Rows[rewardRow.toString()]
    const assetPath = rewardRowObject.ItemDefinition.AssetPathName
    const exportedAsset = await fetch(`https://fortnitecentral.gmatrixgames.ga/api/v1/export?path=${assetPath}`)
    const exportedAssetJSON = await exportedAsset.json()
    return exportedAssetJSON.jsonOutput[0].Properties.DisplayName.sourceString

}

