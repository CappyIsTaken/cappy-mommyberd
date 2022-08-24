const {client, distube, setupCommands} = require("./consts")
const express = require("express")

const app = express()


app.get("/login", async (req,res) => {
    await client.login(process.env.TOKEN)
    setupCommands()
    res.send("Successfully logged in!")
})


app.get("/", (req, res) => {
    res.send("HELLO!!!")
})
app.listen(process.env.PORT || 3000)
