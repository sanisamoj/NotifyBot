import { BotInfo } from "./BotInfo"
import { CreateBotRequest } from "./CreateBotRequest"
import { CreateGroupInfo } from "./CreateGroupInfo"
import { DataForActionWithParticipant } from "./DataForActionWithParticipant"
import { GroupInfo } from "./GroupInfo"
import { NotifyBotConfig } from "./NotifyBotConfig"
import { SendMessageInfo } from "./SendMessageInfo"

export abstract class DatabaseRepository {
    abstract initializeBot(botId: string): Promise<BotInfo>
    abstract registerBot(createBotRequest: CreateBotRequest): Promise<BotInfo>
    abstract getBotById(id: string): Promise<BotInfo>
    abstract getAllBots(): Promise<BotInfo[]>
    abstract getAllBotsWithPagination(page: number, size: number): Promise<BotInfo[]>
    abstract getAllBotsCount(): Promise<number>
    abstract deleteBot(bot: string): Promise<void>
    abstract stopBot(botId: string): Promise<void>
    abstract destroyAllBots(): Promise<void>
    abstract stopAllBots(): Promise<void>
    abstract initializeAllBots(): Promise<void>
    abstract initializeEmergencyBots(): Promise<void>
    abstract initializeEmergencyBot(botId: string): Promise<void>
    abstract updateBotConfig(botId: string, config: NotifyBotConfig | null): Promise<void>
    abstract updateBot(botId: string, field: string, value: any): Promise<void>
    abstract getBotConfig(botId: string): NotifyBotConfig | null
    abstract sendMessage(botId: string, to: string, message: string): Promise<void>
    abstract createGroup(createGroupInfo: CreateGroupInfo): Promise<GroupInfo>
    abstract getGroupById(botId: string, groupId: string): Promise<GroupInfo>
    abstract getAllGroupsFromTheBot(botId: string): Promise<GroupInfo[]>
    abstract deleteGroupById(botId: string, groupId: string): Promise<void>
    abstract addParticipantToTheGroup(info: DataForActionWithParticipant): Promise<void>
    abstract removeParticipantFromTheGroup(info: DataForActionWithParticipant): Promise<void>
    abstract sendMessageTotheGroup(info: SendMessageInfo): Promise<void>
}
