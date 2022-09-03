const {client, distube, setupCommands} = require("./consts")
const express = require("express")
require("dotenv").config()
const cron = require("node-cron")
const utils = require("./util")
const fs = require("fs")




const app = express()


app.get("/", (req, res) => {
    res.send("HELLO!!!")
})

app.listen(process.env.PORT || 3000, async () => {
    await client.login(process.env.TOKEN)
    setupCommands()
    cron.schedule("0 4 * * *", async () => {
        console.log("starting cron job!")
        const ids = await utils.getDiscordIds()
        const me = await client.users.fetch("279956479140954113")
        console.log(ids)
        ids.forEach(async id => {
            console.log("Now doing this account! " + id)
            const accLogin = await utils.loginToFortnite(id)
            const claimResp = await utils.claimDailyReward(id, accLogin)
            const user = await client.users.fetch(id, false)
            if(claimResp.items.length > 0) {
                const reward = claimResp.items[0]
                await user.send(`Hello there, ${user.tag}!\nToday you got: ${reward.quantity}x ${reward.itemType}`)
                await me.send(`${accLogin.displayName} got today: ${reward.quantity}x ${reward.itemType}`)
            }
        })
            
        }, {
            timezone: "Asia/Jerusalem"
        })
    })


