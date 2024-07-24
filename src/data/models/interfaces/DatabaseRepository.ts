import { NotifyBot } from "../../../bots/NotifyBot"
import { BotInfo } from "./BotInfo"
import { CreateBotRequest } from "./CreateBotRequest"

export abstract class DatabaseRepository {
    abstract registerBot(createBotRequest: CreateBotRequest): Promise<BotInfo>
    abstract getBotById(id: string): Promise<BotInfo>
    abstract deleteBot(bot: string): void
    abstract destroyAllBots(): void
    abstract stopAllBots(): void
    abstract restartAllBots(): void
    abstract sendMessage(botId: string, to: string, message: string): void
}
