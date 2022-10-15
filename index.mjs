import { client, distube, setupCommands, setupHandlers } from "./consts.mjs"
import express from "express"
import {config} from "dotenv"
import cron from "node-cron"
import * as utils from "./util.mjs"




const app = express()


app.get("/", (req, res) => {
  res.send("HELLO!!!")
})

app.listen(process.env.PORT || 3000, async () => {
  await client.login(process.env.TOKEN)
  await setupCommands()
  await setupHandlers()
  cron.schedule("0 4 * * *", async () => {
    console.log("starting cron job!")
    const ids = await utils.getDiscordIds()
    const me = await client.users.fetch("279956479140954113", false)
    ids.forEach(async id => {
      console.log("Now doing this account! " + id)
      const accLogin = await utils.loginToFortnite(id)
      const claimResp = await utils.claimDailyReward(id, accLogin)
      const user = await client.users.fetch(id, false)
      if (claimResp.items.length > 0) {
        const reward = claimResp.items[0]
        const displayName = await utils.getDisplayName(reward)
        await user.send(`Hello there, ${user}!\nToday you got: ${reward.quantity}x ${displayName}`)
        await me.send(`${accLogin.displayName} got today: ${reward.quantity}x ${displayName}`)
      }
    })

  }, {
    timezone: "Asia/Jerusalem"
  })
})


