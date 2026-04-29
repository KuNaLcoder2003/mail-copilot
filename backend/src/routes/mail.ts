import express from "express"
import { google } from "googleapis"
import { prisma } from "../prisma.js"
import dotenv from "dotenv"
const CLIENT_ID = `${process.env.GOOGLE_CLIENT_ID}`
const CLIENT_SECRET = `${process.env.GOOGLE_CLIENT_SECRET}`
const REDIRECT_URL = `${process.env.REDIRECT_BACK_URL}`

// Instantiate an auth client object
const authClient = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
)
const mailRouter = express.Router()

mailRouter.post("/get/:id", async (req: express.Request, res: express.Response) => {

    const user = await prisma.users.findFirst({
        where: {
            email: "kunalindia59@gmail.com"
        }
    })
    if (!user) {
        res.status(404).json({
            message: "User not found",
            valid: false
        })
        return
    }
    authClient.setCredentials({
        refresh_token: user.refresh_token
    })

    const gmail = google.gmail({ version: "v1", auth: authClient })
    const message = await gmail.users.messages.get({
        userId: "me",
        id: req.params.id as string
    })
    console.log(message)
    console.log("---------------------")
    console.log("---------------------")
    console.log("\n")
    console.log("Parts : ")
    console.log(message.data.payload?.parts)
    console.log("---------------------")
    console.log("---------------------")
    console.log("\n")
    console.log("Parts with mimetype == text/plain or text/html : ")
    iterateArray(message.data.payload?.parts)
    console.log("---------------------")
    console.log("---------------------")
    console.log("\n")
    console.log("Pay load body")
    console.log(message.data.payload?.body)
    console.log("---------------------")
    console.log("---------------------")
    console.log("\n")
    console.log("Payload headers")
    console.log(message.data.payload?.headers)

})

function iterateArray(arr: any) {
    for (let key in arr) {
        if (arr[key].filename) {
            continue
        } else if (arr[key].parts) {
            iterateArray(arr[key].parts)
        }
        else {
            console.log(arr[key])
            return arr[key]
        }
    }
}
export default mailRouter