import {ObjectId} from "mongodb"
import { NotifyBotConfig } from "./NotifyBotConfig"

export interface BotMongodb {
    _id: ObjectId
    name: string
    description: string
    number: string
    profileImageUrl: string
    admins: string[]
    config: NotifyBotConfig | null
    botType: string
    status: string
    createdAt: string
}