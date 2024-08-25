import { PromoterBotConfig } from "../bots/webjs/promoterBot/data/interfaces/PromoterBotConfig"
import { Config } from "../Config"
import { BotStatus } from "../data/models/enums/BotStatus"
import { BotType } from "../data/models/enums/BotType"
import { NotifyQueues } from "../data/models/enums/NotifyQueues"
import { BotInfo } from "../data/models/interfaces/BotInfo"
import { BotInfoWithPagination } from "../data/models/interfaces/BotInfoWithPagination"
import { BotMongodb } from "../data/models/interfaces/BotMongodb"
import { CreateBotRequest } from "../data/models/interfaces/CreateBotRequest"
import { CreateGroupInfo } from "../data/models/interfaces/CreateGroupInfo"
import { DatabaseRepository } from "../data/models/interfaces/DatabaseRepository"
import { DataForActionWithParticipant } from "../data/models/interfaces/DataForActionWithParticipant"
import { GroupInfo } from "../data/models/interfaces/GroupInfo"
import { NotifyBotConfig } from "../data/models/interfaces/NotifyBotConfig"
import { PaginationResponse } from "../data/models/interfaces/PaginationResponse"
import { SendMessageInfo } from "../data/models/interfaces/SendMessageInfo"
import { SendMessageRequest } from "../data/models/interfaces/SendMessageRequest"
import { SendNotifyServerBotsStatus } from "../data/models/interfaces/SendNotifyServerBotsStatus"
import { paginationMethod } from "../utils/paginationMethod"
import { RabbitMQService } from "./RabbitMQService"

export class BotService {
    private repository: DatabaseRepository

    constructor(database: DatabaseRepository = Config.getDatabaseRepository()) {
        this.repository = database
    }

    async createBot(createBotRequest: CreateBotRequest): Promise<BotInfo> {
        const botInfo: BotInfo = await this.repository.registerBot(createBotRequest)
        return botInfo
    }

    async deleteBotById(id: string): Promise<void> {
        this.repository.deleteBot(id)
    }

    async stopBotById(botId: string): Promise<void> {
        await this.repository.stopBot(botId)
    }

    async stopAllBots(): Promise<void> {
        await this.repository.stopAllBots()
    }

    async restartBotById(botId: string): Promise<void> {
        await this.repository.initializeBot(botId)
    }

    async initializeEmergencyBots(): Promise<void> {
        await this.repository.initializeEmergencyBots()
        this.emitEmergencySignal()
    }

    async emitEmergencySignal() {
        const sendNotifyServerBotsStatus: SendNotifyServerBotsStatus = { notifyBotsStatus: BotStatus.EMERGENCY }
        const rabbitMQService: RabbitMQService = await RabbitMQService.getInstance()
        await rabbitMQService.sendMessage<SendNotifyServerBotsStatus>(NotifyQueues.NotifyServerBotsStatus, sendNotifyServerBotsStatus)
    }

    async initializeEmergencyBot(botId: string): Promise<void> {
        await this.repository.initializeEmergencyBot(botId)
    }

    async getBotById(id: string): Promise<BotInfo> {
        return await this.repository.getBotById(id)
    }

    async getAllBots(): Promise<BotInfo[]> {
        return await this.repository.getAllBots()
    }

    async getAllBotsWithPagination(page: number, size: number): Promise<BotInfoWithPagination> {
        const bots: BotInfo[] = await this.repository.getAllBotsWithPagination(page, size)
        const totalItems: number = await this.repository.getAllBotsCount()
        const paginationResponse: PaginationResponse = paginationMethod(totalItems, size, page)
        const botInfoWithPagination: BotInfoWithPagination = { bots: bots, pagination: paginationResponse }
        return botInfoWithPagination
    }

    async sendMessage(sendMessageRequest: SendMessageRequest) {
        this.repository.sendMessage(sendMessageRequest.botId, sendMessageRequest.phone, sendMessageRequest.message)
    }

    async sendMessageWithImage(botId: string, phone: string, message: string | null, imageFilePath: string) {
        this.repository.sendMessageWithImage(botId, phone, message, imageFilePath)
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

    async updateNotifyBotConfig(botId: string, notifyBotConfig: any | null): Promise<NotifyBotConfig | PromoterBotConfig | null> {
        const botInfo: BotInfo = await this.repository.getBotById(botId)
        if(botInfo.botType === BotType.NOTIFY_BOT) {
            await this.repository.updateBotConfig(botId, notifyBotConfig)
            return this.repository.getNotifyBotConfig(botId)
        } else {
            await this.repository.updatePromoterBotConfig(botId, notifyBotConfig)
            return this.repository.getPromoterBotConfig(botId)
        }
    }
}