import express from "express"
import { google } from "googleapis"
import { prisma } from "../prisma.js"
import dotenv from "dotenv"
import { generateReply, getContext } from "../functions/mailParser.js"
import { cleanAndParseAiResponse } from "../functions/createMail.js"
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
const mailRouter = express.Router()
mailRouter.get('/test', (req, res) => {
    res.send("mail route working");
});

mailRouter.post('/generateReply', async (req: express.Request, res: express.Response) => {
    try {
        const { mail_id, user_id } = req.body
        if (!mail_id || !user_id) {
            res.status(400).json({
                message: "Bad request",
                valid: false
            })
            return
        }
        const mail = await prisma.mails.findUnique({
            where: {
                mail_id: mail_id
            }
        })

        if (!mail) {
            res.status(404).json({
                message: "Mail does not exists",
                valid: false
            })
            return
        }
        const response = await generateReply(mail.body, mail.category, mail.intent)
        console.log(response)
        if (!response) {
            res.status(403).json({
                message: "Error generating response",
                valid: false
            })
            return
        }
        const updateMail = prisma.mails.update({
            where: {
                mail_id: mail.id
            }, data: {
                reply: response
            }
        })
        if (!updateMail) {
            res.status(403).json({
                message: "Error generating response",
                valid: false
            })
            return
        }
        res.status(200).json({
            mail: updateMail,
            valid: true
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

mailRouter.get("/fullContext", async (req: express.Request, res: express.Response) => {
    try {
        const { thread_id, user_id } = req.body

        if (!thread_id || !user_id) {
            res.status(400).json({
                message: "Bad request",
                valid: false
            })
            return
        }
        const user = await prisma.users.findUnique({
            where: {
                id: user_id
            }
        })
        if (!user) {
            res.status(401).json({
                message: "Invalid access as user does not exists",
                valid: false
            })
            return
        }

        authClient.setCredentials({
            refresh_token: user.refresh_token
        })

        const gmail = google.gmail({ version: "v1", auth: authClient })

        const messages = await gmail.users.threads.get({
            userId: "me",
            id: thread_id
        })
        if (!messages.data.messages) {
            return
        }
        let parts: { body: string, html: string, from: string, to: string }[] = []
        for (let i = 0; i < messages.data.messages.length; i++) {
            if (!messages.data.messages[i]?.payload) {
                continue
            }
            else {
                console.log('Parts are : ')
                const extratedParts = iterateArray(messages.data.messages[i]?.payload?.parts, [])
                const from = messages.data.messages[i]?.payload?.headers ? messages?.data?.messages[i]?.payload?.headers?.filter((head: any) => head.name == 'From')[0]?.value : ""
                const to = messages.data.messages[i]?.payload?.headers ? messages?.data?.messages[i]?.payload?.headers?.filter((head: any) => head.name == 'To')[0]?.value : ""
                const html = extratedParts.some((part) => part.mimeType == 'text/html') ? Buffer.from(extratedParts.filter((part) => part.mimeType == 'text/html')[0].body?.data, "base64").toString("utf-8") : ""
                const body = extratedParts.some((part) => part.mimeType == 'text/plain') ? Buffer.from(extratedParts.filter((part) => part.mimeType == 'text/plain')[0].body?.data, "base64").toString("utf-8") : ""
                parts.push({ from: from || "", to: to || "", html: html || "", body: body || "" })
            }
        }
        const ai_response = await getContext(parts)
        console.log(ai_response)
        if (!ai_response) {
            res.status(403).json({
                message: "Unable to get full context",
                valid: false
            })
            return
        }
        const cleanedResponse = cleanAndParseAiResponse(ai_response)
        const db_entry = await prisma.threadContext.upsert({
            where: {
                thread_id: thread_id

            },
            update: {
                context: cleanedResponse.thread_context,
            },
            create: {
                context: cleanedResponse.thread_context,
                thread_id: thread_id,
                user_id: user_id,
            }
        })
        if (!db_entry) {
            res.status(403).json({
                message: "Unable to get full context",
                valid: false
            })
            return
        }
        res.status(200).json({
            valid: true,
            message: "Context created for the thread",
            db_entry
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Unable to get full context",
            valid: false,
            error: error
        })
    }
})

function iterateArray(arr: any, temp: any[] = [], seen = new Set(),
    depth = 0) {
    // this was a bug... every recursive call will inititae a new empty result array
    // temp fix : providing a temp array as param , which will provided to the recursive call also , so no new array is initiated
    // let result: any[] = []
    if (!arr || depth > 40) {
        return temp
    }
    for (let key in arr) {
        if (!key || seen.has(key)) continue;
        seen.add(key);
        if (arr[key].filename) {
            continue
        } else if (arr[key].parts) {
            iterateArray(arr[key].parts, temp, seen, depth + 1)
        }
        else {
            temp.push(arr[key])
        }
    }
    return temp
}
export default mailRouter