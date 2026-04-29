import express from "express"
import { google } from "googleapis"
const router = express.Router()
import dotenv from "dotenv"
dotenv.config()
const CLIENT_ID = `${process.env.GOOGLE_CLIENT_ID}`
const CLIENT_SECRET = `${process.env.GOOGLE_CLIENT_SECRET}`
const REDIRECT_URL = `${process.env.REDIRECT_BACK_URL}`

router.get('/auth/google', async (req: express.Request, res: express.Response) => {
    try {

        // Instantiate an auth client object
        const authClient = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URL
        )
        const url = authClient.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
            prompt: "consent",
            state: "http://localhost:5173/home"
        })
        console.log(url)
        res.status(200).json({
            url
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong",
            valid: false,
            error: error
        })
    }
})
export default router