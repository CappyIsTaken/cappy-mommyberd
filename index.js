const {client, distube, setupCommands} = require("./consts")
const express = require("express")

const app = express()


app.get("/", (req, res) => {
    res.send("HELLO!!!")
})
(async() => {
    await client.login(process.env.TOKEN)
    setupCommands()
    app.listen(process.env.PORT || 3000)

})()