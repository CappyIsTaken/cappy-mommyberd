import fs from "fs-extra"
import path from "path"

export const CURRENT_PATH = process.cwd()


export const relToAbs = (relativePath) => {
    return path.join(CURRENT_PATH, relativePath)
}


export const getFileByIndex = async(relativePath, index) => {
    const files = await fs.readdir(relToAbs(relativePath))
    return relToAbs(files.at(index))
}