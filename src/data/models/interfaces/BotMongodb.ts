import {ObjectId} from "mongodb"

export interface BotMongodb {
    _id: ObjectId
    name: string
    description: string
    number: string
    profileImageUrl: string
    createdAt: string
}