const {client, distube, setupCommands} = require("./consts")
const express = require("express")

const app = express()


app.get("/", (req, res) => {
    res.send("HELLO!!!")
})

app.listen(process.env.PORT || 3000, async () => {
    await client.login(process.env.TOKEN)
    setupCommands()
})

