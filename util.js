const {client, supabaseClient} = require("./consts")


exports.killAccessToken = async (access_token) => {
    const resp = await fetch(`https://account-public-service-prod.ol.epicgames.com/account/api/oauth/sessions/kill/${access_token}`, {
        method: "DELETE",
        headers: {
            Authorization: "bearer " + access_token
        }
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
    const {data,error} = await supabaseClient.from("accounts").update({last_reward: JSON.stringify(itemData)}).eq("id", discord_id)
    await this.killAccessToken(acc_data.access_token)
    return itemData
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

