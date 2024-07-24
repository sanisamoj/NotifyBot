import { ObjectId } from "mongodb"
import { Participant } from "./Participant"

export interface Group {
    _id: ObjectId
    groupId: string
    botId: string
    title: string
    description: string
    imgProfileUrl: string
    superAdmins: string[]
    participants: Participant[]
    createdAt: string
}