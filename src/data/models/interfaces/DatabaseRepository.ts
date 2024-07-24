import { BotInfo } from "./BotInfo"
import { CreateBotRequest } from "./CreateBotRequest"

export abstract class DatabaseRepository {
    abstract registerBot(createBotRequest: CreateBotRequest): Promise<BotInfo>
    abstract getBotById(id: string): Promise<BotInfo>
    abstract deleteBot(bot: string): Promise<BotInfo>
}
