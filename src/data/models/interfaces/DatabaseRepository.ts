import { NotifyBot } from "../../../bots/NotifyBot"
import { BotInfo } from "./BotInfo"
import { CreateBotRequest } from "./CreateBotRequest"
import { CreateGroupInfo } from "./CreateGroupInfo"
import { DataForActionWithParticipant } from "./DataForActionWithParticipant"
import { GroupInfo } from "./GroupInfo"
import { NotifyBotConfig } from "./NotifyBotConfig"
import { SendMessageInfo } from "./SendMessageInfo"

export abstract class DatabaseRepository {
    abstract registerBot(createBotRequest: CreateBotRequest): Promise<BotInfo>
    abstract getBotById(id: string): Promise<BotInfo>
    abstract deleteBot(bot: string): void
    abstract destroyAllBots(): void
    abstract stopAllBots(): void
    abstract restartAllBots(): void
    abstract updateBotConfig(botId: string, config: NotifyBotConfig | null): Promise<void>
    abstract sendMessage(botId: string, to: string, message: string): Promise<void>
    abstract createGroup(createGroupInfo: CreateGroupInfo): Promise<GroupInfo>
    abstract getGroupById(botId: string, groupId: string): Promise<GroupInfo>
    abstract getAllGroupsFromTheBot(botId: string): Promise<GroupInfo[]>
    abstract deleteGroupById(botId: string, groupId: string): Promise<void>
    abstract addParticipantToTheGroup(info: DataForActionWithParticipant): Promise<void>
    abstract removeParticipantFromTheGroup(info: DataForActionWithParticipant): Promise<void>
    abstract sendMessageTotheGroup(info: SendMessageInfo): Promise<void>
}
