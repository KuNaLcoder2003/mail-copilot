import { google } from "googleapis"
import { prisma } from "../prisma.js"
import { parseMail } from "./mailParser.js"
import dotenv from "dotenv"
dotenv.config()

type Mail = {
    from: string // email of sender
    to: string // email of reciever
    user_id: string
    body: string
    html: string
    intent: string
    subject: string
    time: string
    mail_id: string
    thread_id: string
    category: "SALES" | "PURCHASE" | "COLLABORATION" | "PAYMENT"
    cc: string
}

type User = {
    id: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
    name: string;
    refresh_token: string;
    access_token: string;
}

const CLIENT_ID = `${process.env.GOOGLE_CLIENT_ID}`
const CLIENT_SECRET = `${process.env.GOOGLE_CLIENT_SECRET}`
const REDIRECT_URL = `${process.env.REDIRECT_BACK_URL}`

// Instantiate an auth client object
const authClient = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
)

// function to extract parts of email that has actual body or html (mail content) => Uses Recusrion
function iterateArray(arr: any) {
    let result: any[] = []
    if (!arr || arr == undefined) {
        return []
    }
    // console.log('Inside Recursive call')
    // console.log('Inputs recvd : ', arr)
    for (let key in arr) {
        if (arr[key].filename) {
            continue
        } else if (arr[key].parts) {
            iterateArray(arr[key].parts)
        }
        else {
            // console.log('Extracted parts : ', arr[key])
            result.push(arr[key])
        }
    }
    return result
}

// for extracting josn object form AI response
export function cleanAndParseAiResponse(str: string) {
    if (!str) {
        return
    }
    const raw_string = str;

    // remove ```json and ``` wrappers
    const cleaned = raw_string
        .replace(/^```json\s*/, '')  // remove starting ```json
        .replace(/```$/, '');        // remove ending ```

    // parse JSON
    const obj = JSON.parse(cleaned);

    return obj
}


// step-1 : a function to fetch mails ids 

async function getMailIds() {
    try {
        const users = await prisma.$transaction(async (tx) => {
            const users = await tx.users.findMany()
            if (!users) {
                throw new Error("No Users Found")
            }
            const mails_ids = (await Promise.all(users.map(async (user) => {
                authClient.setCredentials({
                    refresh_token: user.refresh_token
                })
                const gmail = google.gmail({ version: "v1", auth: authClient })
                const messages = await gmail.users.messages.list({
                    userId: "me",
                    maxResults: 5
                })
                if (messages) {
                    return { messages, user: user }
                } else {
                    return null
                }
            }))).filter(item => item !== null)
            return { mails_ids }
        }, { timeout: 10000, maxWait: 5000 })
        if (!users.mails_ids) {
            return null
        } else {
            return users.mails_ids
        }
    } catch (error) {
        console.log(error)
        return null
    }
}

// step - 2 : get mail content
async function getMailContent(user_mails: { messages: any[], user: User }[]) {
    try {
        const mail_content = (await Promise.all(user_mails.map(async (mail: any) => {
            authClient.setCredentials({
                refresh_token: mail.user.refresh_token
            })
            const gmail = google.gmail({ version: "v1", auth: authClient })
            const messages = (await Promise.all(mail.messages?.data?.messages.map(async (mail_obj: any) => {
                const mail_content = await gmail.users.messages.get({
                    userId: "me",
                    id: mail_obj.id
                })
                if (mail_content) {
                    let obj = {
                        mail_id: mail_content.data.id,
                        thread_id: mail_content.data.threadId,
                        user: mail.user,
                        headers: mail_content.data.payload?.headers,
                        parts: mail_content.data.payload?.parts
                    }
                    return obj;
                } else {
                    return null
                }
            }))).filter(item => item !== null)
            return messages
        }))).filter(item => item !== null)
        return mail_content
    } catch (error) {
        console.log(error)
        return null
    }
}

// step - 3 : generate category , intent and reply from AI
async function parseEmails(emails: any[]) {
    if (!emails) {
        return null
    }
    const response = await Promise.all(emails.map((email: any) => {
        const process = email.map(async (item: any) => {
            const parts = iterateArray(item.parts)
            const headers = item.headers;
            let obj: Mail = {
                intent: "", // initaillaly empty -> will be updated based on AI response
                mail_id: item.mail_id,
                thread_id: item.thread_id,
                html: parts && parts.filter((part: any) => part.mimeType == 'text/html')[0] ? Buffer.from(parts.filter((part: any) => part.mimeType == 'text/html')[0].body.data, "base64").toString("utf-8") : "",
                body: parts && parts.filter((part: any) => part.mimeType == 'text/plain')[0] ? Buffer.from(parts.filter((part: any) => part.mimeType == 'text/plain')[0].body.data, "base64").toString("utf-8") : "",
                user_id: item.user.id,
                from: headers ? headers.filter((head: any) => head.name == 'From')[0].value : "",
                to: headers ? headers.filter((head: any) => head.name == 'To')[0].value : "",
                cc: headers && headers.filter((head: any) => head.name == 'Cc')[0] ? headers.filter((head: any) => head.name == 'Cc')[0].value : "",
                time: headers ? headers.filter((head: any) => head.name == 'Date')[0].value : "",
                subject: headers && headers.filter((head: any) => head.name == 'Subject')[0] ? headers.filter((head: any) => head.name == 'Subject')[0].value : "",
                category: "SALES" // initaillaly Sales -> will be updated based on AI response
            }
            const response = await parseMail(obj.body || obj.html) // this is the AI call => AI gives intent 
            const cleaned_response = cleanAndParseAiResponse(response)
            if (!cleaned_response) {
                obj.category = "SALES"
                obj.intent = ""
            }
            else {
                obj.category = cleaned_response.category
                obj.intent = cleaned_response.intent
            }
            // console.log(cleaned_response)
            // creating DB entry
            // step - 4 : create entry in DB , if mail_id exists then skip , else create ( although DB schema as a @unique attribute for mail_id => so duplicates wont be allowed)
            const entry = await prisma.$transaction(async (tx) => {
                const new_mail = await tx.mails.create({
                    data: obj
                })
                return new_mail
            }, { timeout: 10000, maxWait: 5000 })
            if (!entry) {
                return false
            }
            return true
        })
        return process
    }))
    return response

}

async function main() {
    const result = await getMailIds()
    if (!result) {
        return
    }
    const response = await getMailContent(result as any[])
    if (!response || !response) {
        return
    }
    const data = await parseEmails(response)
    console.log(data)

}

main() // this function will be called in a cron job that will every minute or every hour , for testing purposes this has to be called manually 




