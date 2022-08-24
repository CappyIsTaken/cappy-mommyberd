const {client, distube} = require("./consts")
const express = require("express")

const app = express()


app.get("/", (req, res) => {
    res.send("HELLO!!!")
})

exports = app



client.login(process.env.TOKEN)

