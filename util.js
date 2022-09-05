const e = require("express")
const {client, supabaseClient} = require("./consts")
const newFetch = require("fetch-retry")(fetch)


exports.killAccessToken = async (access_token) => {

    const resp = await newFetch(`https://account-public-service-prod.ol.epicgames.com/account/api/oauth/sessions/kill/${access_token}`, {
        method: "DELETE",
        headers: {
            Authorization: "bearer " + access_token
        },
        retries: 3,
        retryDelay: 1000
    })
    return resp
}

exports.getDiscordIds = async () => {
    return (await supabaseClient.from("accounts").select("id")).data.map(x => x.id)
}

exports.claimDailyReward = async (discord_id, acc_data) => {
    const resp = await fetch(`https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/profile/${acc_data.account_id}/client/ClaimLoginReward?profileId=campaign&rvn=-1`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + acc_data.access_token,
        },
        body: JSON.stringify({})
    })
    const dailyRewardData = await resp.json()
    const itemData = dailyRewardData.notifications[0]
    if(itemData.items.length > 0) {
        const {data,error} = await supabaseClient.from("accounts").update({last_reward: JSON.stringify(itemData)}).eq("id", discord_id)
        await this.killAccessToken(acc_data.access_token)
        return itemData
    }
    else {
        const {data, error} = await supabaseClient.from("accounts").select().eq("id", discord_id)
        await this.killAccessToken(acc_data.access_token)
        if(data) {
            return JSON.parse(data[0].last_reward)
        }
    }
    
}


exports.loginToFortnite = async (discord_id) => {
    const {data, error} = await supabaseClient.from("accounts").select().eq("id", discord_id)
    let accData = data[0]
    console.log(accData, error)
    if(data) {
        let urlData = new URLSearchParams()
        urlData.append("grant_type", "device_auth")
        urlData.append("account_id", accData.account_id)
        urlData.append("secret", accData.secret)
        urlData.append("device_id", accData.device_id)
        const response = await fetch("https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "basic M2Y2OWU1NmM3NjQ5NDkyYzhjYzI5ZjFhZjA4YThhMTI6YjUxZWU5Y2IxMjIzNGY1MGE2OWVmYTY3ZWY1MzgxMmU="
            },
            body: urlData
        })
        const jsonResp = await response.json()
        return {
            access_token: jsonResp.access_token,
            displayName: jsonResp.displayName,
            account_id: jsonResp.account_id
        }
    }
}

exports.getDisplayName = async (dailyRewardData) => {
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

