import {Client, Message, MessageMentions, MessageCollector} from "discord.js"
import {client, distube, isInBotVC} from "../consts.mjs"
import {loginToFortnite, doMCPCommand} from "../util.mjs"
import fs from "fs-extra"

export let name = "testmcp"
export let aliases = []
export let run = async (message, args) => {
    message.channel.send("Processing request...").then(async msg => {
    let [mcpCommand, profile, discordId, body] = args
    let resp = await loginToFortnite(discordId)
    if(resp === undefined) return msg.edit("No account was found!")
    let test = await doMCPCommand(mcpCommand, profile, resp, body, true)
    let testTxt = JSON.stringify(test, null, 4)
    if(testTxt.length > 4000) {
        await fs.outputFile(`/tmp/${mcpCommand}_${profile}_${resp.account_id}.json`, testTxt)
        await msg.edit({
            content: "",
            files: [`/tmp/${mcpCommand}_${profile}_${resp.account_id}.json`]
        })
    }
    else {
        await msg.edit(testTxt)
    }
    })
    
}
