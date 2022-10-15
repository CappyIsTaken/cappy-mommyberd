import  * as twitter from "../twitterutil.mjs"
import { relToAbs } from "../fileutils.mjs"
import fs from "fs-extra"

const REGEX = /(^|[^'"])(https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+))/

export const predicate = (url) => {
    return url.match(REGEX)
}

export const run = async (message, url, args) => {
        let id = predicate(url).at(4);
        try {
          await message.delete();
          const firstArg = args.shift()
          const vidData = await twitter.getTwitterVideo(id, firstArg)
          if(vidData == undefined) return message.channel.send("Video wasn't found!")
          if(vidData.type == "normal") {
            await message.channel.send(
                `${vidData.url}\n[Posted by ${
                  message.author
                }]\n[Original tweet: ${url}]\n${
                  args.length > 0 ? `[Additional body: ${args.join(" ")}]` : ""
                }`
            );
          }
          else if(vidData.type == "custom") {
            const tweetIdPath = relToAbs(id.toString())
            await message.channel.send({
              content:  `\n[Posted by ${
                  message.author
                }]\n[Original tweet: ${url}]`,
                files: [vidData.video]
            });
            fs.removeSync(tweetIdPath)
          }          
        }
        catch (ex) {
          if (ex.method == "DELETE" && ex.url.includes("messages")) {
            message.channel.send("Can't delete the original message!");
          }
        console.log(ex)
        }
}