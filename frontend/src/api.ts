import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:4000/api/v1",
    headers: {
        'Content-Type': 'application/json'
    }
})

export const getMails = () => {
    return api.get("/me")
}

export const sigin = () => {
    return api.get('/auth/google')
}

export const getFullContext = (data: { thread_id: string, user_id: string }) => {
    return api.post("/mail/fullContext", data)
}

export const getCompleteThread = (threadId: string) => {
    return api.get(`/mail/thread/${threadId}`)
}

export const sendDraftPrompt = async (data: { thread_id: string, user_prompt: string }) => {
    return api.post("/mail/tweakReply", data)
}
