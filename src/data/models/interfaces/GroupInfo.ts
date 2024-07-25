import { Participant } from "./Participant"

export interface GroupInfo {
    id: string
    botId: string
    title: string
    description: string
    imgProfileUrl: string | null
    participants: Participant[]
    createdAt: string
}