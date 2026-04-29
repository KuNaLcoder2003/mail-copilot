import Anthropic from "@anthropic-ai/sdk";
import { PARSER_PROMPT } from "../prompts/parserPrompt.js";
import type { TextBlock } from "@anthropic-ai/sdk/resources";
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
const CLAUDE_API_KEY = `${process.env.CLAUDE_API_KEY}`
const client = new Anthropic({
    apiKey: CLAUDE_API_KEY
})

export const parseMail = async (body: string) => {
    const response = await client.messages.create({
        max_tokens: 10000,
        model: 'claude-sonnet-4-6',
        system: PARSER_PROMPT,
        messages: [
            {
                role: "user",
                content: body
            }
        ]
    })
    // console.log(response.content[0])
    const answer: string = (response.content[0] as TextBlock).text
    return answer
}