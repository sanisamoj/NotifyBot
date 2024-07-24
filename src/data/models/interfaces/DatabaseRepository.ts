import { BotInfo } from "./BotInfo"
import { CreateBotRequest } from "./CreateBotRequest"
import { CreateGroupInfo } from "./CreateGroupInfo"
import { GroupInfo } from "./GroupInfo"

export abstract class DatabaseRepository {
    abstract registerBot(createBotRequest: CreateBotRequest): Promise<BotInfo>
    abstract getBotById(id: string): Promise<BotInfo>
    abstract deleteBot(bot: string): void
    abstract destroyAllBots(): void
    abstract stopAllBots(): void
    abstract restartAllBots(): void
    abstract sendMessage(botId: string, to: string, message: string): void
    abstract createGroup(createGroupInfo: CreateGroupInfo): Promise<GroupInfo>
}
