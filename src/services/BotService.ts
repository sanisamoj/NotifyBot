import { Config } from "../Config"
import { BotInfo } from "../data/models/interfaces/BotInfo"
import { CreateBotRequest } from "../data/models/interfaces/CreateBotRequest"
import { CreateGroupInfo } from "../data/models/interfaces/CreateGroupInfo"
import { DatabaseRepository } from "../data/models/interfaces/DatabaseRepository"
import { DataForActionWithParticipant } from "../data/models/interfaces/DataForActionWithParticipant"
import { GroupInfo } from "../data/models/interfaces/GroupInfo"
import { SendMessageInfo } from "../data/models/interfaces/SendMessageInfo"
import { SendMessageRequest } from "../data/models/interfaces/SendMessageRequest"

export class BotService {
    private repository: DatabaseRepository

    constructor(database: DatabaseRepository = Config.getDatabaseRepository()) {
        this.repository = database
    }

    async createBot(createBotRequest: CreateBotRequest): Promise<BotInfo> {
        const botInfo: BotInfo = await this.repository.registerBot(createBotRequest)
        return botInfo
    }

    async deleteBotById(id: string) {
        this.repository.deleteBot(id)
    }

    async getBotById(id: string): Promise<BotInfo> {
        return this.repository.getBotById(id)
    }

    async sendMessage(sendMessageRequest: SendMessageRequest) {
        this.repository.sendMessage(sendMessageRequest.botId, sendMessageRequest.phone, sendMessageRequest.message)
    }

    async createGroup(createGroupInfo: CreateGroupInfo): Promise<GroupInfo> {
        const groupInfo: GroupInfo = await this.repository.createGroup(createGroupInfo)
        return groupInfo
    }

    async getGroupById(botId: string, groupId: string): Promise<GroupInfo> {
        const group: GroupInfo = await this.repository.getGroupById(botId, groupId)
        return group
    }

    async getAllGroupsFromTheBot(botId: string): Promise<GroupInfo[]> {
        const groups: GroupInfo[] = await this.repository.getAllGroupsFromTheBot(botId)
        return groups
    }

    async addParticipantToTheGroup(info: DataForActionWithParticipant): Promise<void> {
        await this.repository.addParticipantToTheGroup(info)
    }

    async removeParticipantFromTheGroup(info: DataForActionWithParticipant): Promise<void> {
        await this.repository.removeParticipantFromTheGroup(info)
    }

    async deleteGroup(botId: string, groupId: string): Promise<void> {
        await this.repository.deleteGroupById(botId, groupId)
    }

    async sendMessageToGroup(sendMessageInfo: SendMessageInfo): Promise<void> {
        await this.repository.sendMessageTotheGroup(sendMessageInfo)
    }
}