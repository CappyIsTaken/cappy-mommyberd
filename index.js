const {client, distube} = require("./consts")
const express = require("express")

const app = express()


app.get("/", (req, res) => {
    res.send("HELLO!!!")
})

app.listen(process.env.PORT || 3000)
client.login(process.env.TOKEN)

