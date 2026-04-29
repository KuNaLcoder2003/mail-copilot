
import express from "express"
import cors from "cors"
import { gmail_v1, google } from "googleapis"
import router from "./routes/auth.js"
import { prisma } from "./prisma.js"
import cookieParser from "cookie-parser"
import { parseMail } from "./functions/mailParser.js"
// import { createMails } from "./functions/createMail.js"
import dotenv from "dotenv"
import cron from "node-cron";
import mailRouter from "./routes/mail.js"
const app = express()
app.use(cors())
app.use(cookieParser())
app.use(express.json())
dotenv.config()

const CLIENT_ID = `${process.env.GOOGLE_CLIENT_ID}`
const CLIENT_SECRET = `${process.env.GOOGLE_CLIENT_SECRET}`
const REDIRECT_URL = `${process.env.REDIRECT_BACK_URL}`

// Instantiate an auth client object
const authClient = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
)

// Webhook handler for google auth login
app.get('/auth/google/callback', async (req: express.Request, res: express.Response) => {
    const code = req.query.code as string;
    if (!code) {
        return
    }
    const oauth2 = google.oauth2({
        auth: authClient,
        version: "v2",
    });

    const { tokens } = await authClient.getToken(code as string)
    authClient.setCredentials({
        refresh_token: tokens.refresh_token as string
    })

    const userInfo = await oauth2.userinfo.get()
    if (!userInfo || !userInfo.data) {
        res.redirect("http:/localhost:5173/error")
        return
    }

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.users.findFirst({
            where: {
                email: userInfo.data.email as string
            }
        })

        if (user) {
            const updated = await tx.users.update({
                where: {
                    id: user.id
                },
                data: {
                    access_token: tokens.access_token as string,
                    refresh_token: tokens.refresh_token as string
                }
            })
            if (updated) {
                return true
            } else {
                return false
            }
        }
        else {
            const new_user = await tx.users.create({
                data: {
                    email: userInfo.data.email as string,
                    name: userInfo.data.name as string,
                    access_token: tokens.access_token as string,
                    refresh_token: tokens.access_token as string,
                    created_at: new Date(),
                    updated_at: new Date(),
                    password: ""
                }
            })
            if (!new_user) {
                return true
            } else {
                return false
            }
        }
    }, { timeout: 10000, maxWait: 5000 })
    if (!result) {
        res.redirect("http:/localhost:5173/error")
        return
    }
    else {
        res.cookie("user", JSON.stringify({
            email: userInfo.data.email,
            name: userInfo.data.name,
        }), {
            httpOnly: true,
            secure: false, // true in production (HTTPS)
            sameSite: "lax"
        });
        res.redirect(req.query.state as string || "http://localhost:5173/home");
        return
    }
})


app.get('/api/v1/me', async (req: express.Request, res: express.Response) => {
    try {
        // const { email } = req.cookies
        // if (!email) {
        //     res.status(401).json({
        //         message: 'Invalid access'
        //     })
        //     return
        // }
        const user = await prisma.users.findFirst({
            where: {
                email: "kunalindia59@gmail.com"
            }
        })
        if (!user) {
            res.status(404).json({
                message: 'User not found'
            })
            return
        }
        const mails = await prisma.mails.findMany({
            where: {
                user_id: user.id
            }
        })
        res.status(200).json({
            user,
            mails
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong"
        })
    }
})

app.use('/api/v1', router)
app.use('/api/v1/mail', mailRouter)

cron.schedule("* * * * *", () => {
    console.log("running every minute");
});


app.listen(4000, () => {
    console.log('App Started')
})



