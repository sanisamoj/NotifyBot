import { NotifyBot } from "../../bots/NotifyBot";
import { BotInfo } from "../models/interfaces/BotInfo";
import { CreateBotRequest } from "../models/interfaces/CreateBotRequest";
import { DatabaseRepository } from "../models/interfaces/DatabaseRepository";

export class DefaultRepository extends DatabaseRepository {
    private static notifyBots: NotifyBot[] = []

    registerBot(createBotRequest: CreateBotRequest): Promise<BotInfo> {
        throw new Error()
    }
    getBotById(id: string): Promise<BotInfo> {
        throw new Error()
    }
    deleteBot(id: string): Promise<BotInfo> {
        throw new Error()
    }
    
}