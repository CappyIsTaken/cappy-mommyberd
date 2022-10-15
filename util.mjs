import {supabaseClient, client} from "./consts.mjs"
import fetchinator from "fetch-retry"
import fs from "fs-extra"
import { Colors, EmbedBuilder } from "discord.js"

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
        await killAccessToken(accData.access_token)
        delete accData.access_token
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

const randomIndex = (arr) => {
    const l = arr.length;
    return Math.round(Math.random()*l)
}


const createClaimEmbed = (reward) => {
    const colors = Object.values(Colors)
    const embed = new EmbedBuilder().setTitle("Daily Rewards Claimer").setDescription(`The daily reward for day ${reward.days} is: ${reward.quantity}x ${reward.displayName}!`).setColor(colors[randomIndex(colors)]).setImage()
    return embed
}

export let claimDailyRewards = async () => {
  const ids = await getDiscordIds()
    const me = await client.users.fetch("207188862273978370", false)
    ids.forEach(async id => {
      console.log("Now doing this account! " + id)
      const accLogin = await loginToFortnite(id)
      const reward = await claimDailyReward(accLogin)
      const user = await client.users.fetch(id, false)
      await user.send({embeds: [createClaimEmbed(reward)]}).catch(x => {})
      await me.send(`${accLogin.displayName} got for day ${reward.days}: ${reward.quantity}x ${reward.displayName}`)
  })
}

export let claimDailyReward = async (acc_data) => {
    const dailyRewardData = await doMCPCommand("ClaimLoginReward", "campaign", acc_data, "{}", true)
    const days = dailyRewardData.notifications[0].daysLoggedIn
    const itemData = await getRewardDataByDay(days)
    const {data, err} = await supabaseClient.from("accounts").update({last_reward_id: itemData.id, days_logged_in: days, quantity: itemData.quantity}).eq("id", acc_data.discordId)
    return {...itemData, days}
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

export let getRewardDataByDay = async (day) => {
    const row = (day-1)%336
    const dailyRewards = await fs.readJson("./DailyRewards.json")
    const localizedNames = await fs.readJson("./Localized.json")
    const rows = dailyRewards[0].Rows
    const data = rows[row.toString()]
    const id = data.ItemDefinition.AssetPathName.split(".")[1].toLowerCase()
    return {
        displayName: localizedNames[id],
        id: id,
        quantity: data.ItemCount,
    }
}

