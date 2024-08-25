import { ObjectId } from "mongodb"
import { BotInfo } from "../models/interfaces/BotInfo"
import { CreateBotRequest } from "../models/interfaces/CreateBotRequest"
import { DatabaseRepository } from "../models/interfaces/DatabaseRepository"
import { BotMongodb } from "../models/interfaces/BotMongodb"
import { BotCreateData } from "../models/interfaces/BotCreateData"
import { Errors } from "../models/enums/Errors"
import { CreateGroupInfo } from "../models/interfaces/CreateGroupInfo"
import { GroupInfo } from "../models/interfaces/GroupInfo"
import { Group } from "../models/interfaces/Group"
import { Participant } from "../models/interfaces/Participant"
import { NotifyBot } from "../../bots/webjs/notifyBot/NotifyBot"
import { DataForActionWithParticipant } from "../models/interfaces/DataForActionWithParticipant"
import { SendMessageInfo } from "../models/interfaces/SendMessageInfo"
import { Client, GroupChat } from "whatsapp-web.js"
import { NotifyBotConfig } from "../models/interfaces/NotifyBotConfig"
import { Fields } from "../models/enums/Fields"
import { BotStatus } from "../models/enums/BotStatus"
import { NotifyVenomBot } from "../../bots/venom/NotifyVenomBot"
import { MongodbOperations } from "../../database/MongodbOperations"
import { CollectionsInDb } from "../models/enums/CollectionsInDb"
import { BotType } from "../models/enums/BotType"
import { PromoterBot } from "../../bots/webjs/promoterBot/PromoterBot"
import { AbstractNotifyBot } from "../models/abstracts/AbstractNotifyBot"
import { Whatsapp } from "venom-bot"
import { PromoterBotConfig } from "../../bots/webjs/promoterBot/data/interfaces/PromoterBotConfig"

export class DefaultRepository extends DatabaseRepository {
    private static notifyBots: AbstractNotifyBot<Client | Whatsapp>[] = []
    private static promoterBots: PromoterBot[] = []
    private mongodb: MongodbOperations = new MongodbOperations()

    async initializeBot(botId: string): Promise<BotInfo> {
        const botMongodb: BotMongodb | null = await this.mongodb.return<BotMongodb>(CollectionsInDb.Bots, { _id: new ObjectId(botId) })
        if (!botMongodb) { throw new Error(Errors.BotNotFound) }

        let botData: BotCreateData = {
            id: botMongodb._id.toString(),
            name: botMongodb.name,
            description: botMongodb.description,
            profileImage: botMongodb.profileImageUrl,
            admins: botMongodb.admins,
            config: botMongodb.config
        }

        const botIsAlreadyRunning: AbstractNotifyBot<Client | Whatsapp> | undefined = DefaultRepository.notifyBots.find(element => element.id === botData.id)

        if (botMongodb.botType === BotType.NOTIFY_BOT) {
            if (botIsAlreadyRunning !== undefined) { throw new Error(Errors.TheBotIsAlreadyRunning) }
            const notifyBot: NotifyBot = new NotifyBot(botData)
            DefaultRepository.notifyBots.push(notifyBot)

        } else {
            const promoterBot: PromoterBot = new PromoterBot(botData)
            DefaultRepository.promoterBots.push(promoterBot)
        }

        return this.botInfoFactory(botMongodb)
    }

    async registerBot(createBotRequest: CreateBotRequest): Promise<BotInfo> {
        const botMongodb: BotMongodb = this.botMongodbFactory(createBotRequest)
        await this.mongodb.register<BotMongodb>(CollectionsInDb.Bots, botMongodb)
        return await this.initializeBot(botMongodb._id.toString())
    }

    private botMongodbFactory(createBotRequest: CreateBotRequest): BotMongodb {
        const botId: ObjectId = new ObjectId()
        const botMongodb: BotMongodb = {
            _id: botId,
            name: createBotRequest.name,
            description: createBotRequest.description,
            number: "",
            profileImageUrl: createBotRequest.profileImage ?? "",
            admins: createBotRequest.admins,
            config: createBotRequest.config,
            botType: createBotRequest.botType,
            status: BotStatus.STARTED,
            createdAt: new Date().toISOString()
        }

        return botMongodb
    }

    async getBotById(id: string): Promise<BotInfo> {
        const botMongodb: BotMongodb | null = await this.mongodb.return<BotMongodb>(CollectionsInDb.Bots, { _id: new ObjectId(id) })
        if (!botMongodb) { throw new Error(Errors.BotNotFound) }
        return this.botInfoFactory(botMongodb)
    }

    async getAllBots(): Promise<BotInfo[]> {
        const botMongodbList: BotMongodb[] = await this.mongodb.returnAll<BotMongodb>(CollectionsInDb.Bots)
        return this.botInfoListFactory(botMongodbList)
    }

    async getAllBotsWithPagination(page: number, size: number): Promise<BotInfo[]> {
        const botMongodbList: BotMongodb[] = await this.mongodb.returnAllWithPagination<BotMongodb>(CollectionsInDb.Bots, page, size)
        return this.botInfoListFactory(botMongodbList)
    }

    async getAllBotsCount(): Promise<number> {
        return await this.mongodb.countDocuments(CollectionsInDb.Bots)
    }

    private async botInfoListFactory(botMongodbList: BotMongodb[]): Promise<BotInfo[]> {
        // Create a list of promises to map each botMongodb to botInfo
        const botInfoPromises: Promise<BotInfo>[] = botMongodbList.map(async (botMongodb: BotMongodb) => {
            return await this.botInfoFactory(botMongodb)
        })

        // Waits for all promises to be resolved and returns the result
        const botInfoList: BotInfo[] = await Promise.all(botInfoPromises)
        return botInfoList
    }

    private async botInfoFactory(botMongodb: BotMongodb): Promise<BotInfo> {
        const botId: string = botMongodb._id.toString()
        let bot: AbstractNotifyBot<Client | Whatsapp> | PromoterBot | undefined

        if (botMongodb.botType === BotType.NOTIFY_BOT) {
            bot = DefaultRepository.notifyBots.find(element => element.id === botId)
        } else {
            bot = DefaultRepository.promoterBots.find(element => element.id === botId)
        }

        const qrCode: string = bot?.qrCode ?? "undefined"
        const groups: GroupInfo[] = await this.getAllGroupsFromTheBot(botId)

        const botInfo: BotInfo = {
            id: botId,
            name: botMongodb.name,
            description: botMongodb.description,
            number: botMongodb.number,
            profileImageUrl: botMongodb.profileImageUrl,
            qrCode: qrCode,
            groups: groups,
            config: botMongodb.config,
            botType: botMongodb.botType,
            status: botMongodb.status,
            createdAt: botMongodb.createdAt
        }

        return botInfo
    }

    private getNotifyBot(botId: string): AbstractNotifyBot<Client | Whatsapp> {
        const notifyBot: AbstractNotifyBot<Client | Whatsapp> | undefined = DefaultRepository.notifyBots.find(element => element.id === botId)
        if (!notifyBot) { throw new Error(Errors.BotNotFound) }
        return notifyBot
    }

    private getPromoterBot(botId: string): PromoterBot {
        const promoterBot: PromoterBot | undefined = DefaultRepository.promoterBots.find(element => element.id === botId)
        if (!promoterBot) { throw new Error(Errors.BotNotFound) }
        return promoterBot
    }

    private removeNotifyBot(botId: string): void {
        const botIndex = DefaultRepository.notifyBots.findIndex(element => element.id === botId)
        if (botIndex === -1) {
            throw new Error(Errors.BotNotFound)
        }
        DefaultRepository.notifyBots.splice(botIndex, 1)
    }

    async deleteBot(id: string): Promise<void> {
        const index: number = DefaultRepository.notifyBots.findIndex(element => element.id === id)
        if (index !== -1) {
            const notifyBot: AbstractNotifyBot<Client | Whatsapp> = DefaultRepository.notifyBots[index]
            notifyBot.destroy()
        }

        this.mongodb.delete(CollectionsInDb.Bots, { _id: new ObjectId(id) })
        this.removeBotFromTheList(id)
    }

    async destroyBot(botId: string): Promise<void> {
        await this.getNotifyBot(botId).destroy()
        this.removeBotFromTheList(botId)
    }

    async stopBot(botId: string): Promise<void> {
        await this.getNotifyBot(botId).stop()
        this.removeNotifyBot(botId)
        this.removeBotFromTheList(botId)
    }

    async destroyAllBots(): Promise<void> {
        DefaultRepository.notifyBots.forEach(async (element: AbstractNotifyBot<Client | Whatsapp>) => { await element.destroy() })
    }

    async stopAllBots(): Promise<void> {
        DefaultRepository.notifyBots.forEach(async (element: AbstractNotifyBot<Client | Whatsapp>) => { await element.stop() })
    }

    private async removeBotFromTheList(botId: String) {
        const index = DefaultRepository.notifyBots.findIndex(bot => bot.id === botId)
        if (index !== -1) {
            DefaultRepository.notifyBots.splice(index, 1)
        }
    }

    async initializeAllBots(): Promise<void> {
        const allBotsInDb: BotMongodb[] = await this.mongodb.returnAll<BotMongodb>(CollectionsInDb.Bots)

        allBotsInDb.forEach(((bot: BotMongodb) => {
            if (bot.status !== BotStatus.DESTROYED) {
                this.initializeBot(bot._id.toString())
            }
        }))
    }

    async initializeEmergencyBots(): Promise<void> {
        DefaultRepository.notifyBots = []
        const allBotsInDb: BotMongodb[] = await this.mongodb.returnAll<BotMongodb>(CollectionsInDb.Bots)

        allBotsInDb.forEach(((bot: BotMongodb) => {
            if (bot.status !== BotStatus.DESTROYED) {
                const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(bot._id.toString())
                notifyBot.stop()

                const botData: BotCreateData = {
                    id: bot._id.toString(),
                    name: bot.name,
                    description: bot.description,
                    profileImage: bot.profileImageUrl,
                    admins: bot.admins,
                    config: bot.config
                }

                const notifyVenomBot: NotifyVenomBot = new NotifyVenomBot(botData)
                DefaultRepository.notifyBots.push(notifyVenomBot)
            }
        }))
    }

    async initializeEmergencyBot(botId: string): Promise<void> {
        const botMongodb: BotMongodb | null = await this.mongodb.return<BotMongodb>(CollectionsInDb.Bots, { _id: new ObjectId(botId) })
        if (!botMongodb) { throw new Error(Errors.BotNotFound) }

        if (botMongodb.status !== BotStatus.DESTROYED) {
            const botId: string = botMongodb._id.toString()

            try {
                const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(botId)
                await notifyBot.stop()
                this.removeNotifyBot(botId)
            } catch (e: any) { }

            const botData: BotCreateData = {
                id: botId,
                name: botMongodb.name,
                description: botMongodb.description,
                profileImage: botMongodb.profileImageUrl,
                admins: botMongodb.admins,
                config: botMongodb.config
            }

            const notifyVenomBot: NotifyVenomBot = new NotifyVenomBot(botData)
            DefaultRepository.notifyBots.push(notifyVenomBot)
        }
    }

    async updateBotConfig(botId: string, config: NotifyBotConfig | null): Promise<void> {
        await this.mongodb.update<BotMongodb>(CollectionsInDb.Bots, { [Fields.Id]: new ObjectId(botId) }, { config: config })
        const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(botId)
        notifyBot.updateBotConfig(config)
    }

    async updatePromoterBotConfig(botId: string, config: PromoterBotConfig | null) {
        await this.mongodb.update<BotMongodb>(CollectionsInDb.Bots, { [Fields.Id]: new ObjectId(botId) }, { config: config })
        const promoterBot: PromoterBot = this.getPromoterBot(botId)
        promoterBot.updateConfig(config)
    }

    async updateBot(botId: string, field: string, config: any): Promise<void> {
        await this.mongodb.update<BotMongodb>(CollectionsInDb.Bots, { [Fields.Id]: new ObjectId(botId) }, { [field]: config })
    }

    getNotifyBotConfig(botId: string): NotifyBotConfig | null {
        const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(botId)
        const notifyBotConfig: NotifyBotConfig | null = notifyBot.getBotConfig()
        return notifyBotConfig
    }

    getPromoterBotConfig(botId: string): PromoterBotConfig | null {
        const promoterBot: PromoterBot = this.getPromoterBot(botId)
        const promoterBotConfig: PromoterBotConfig | null = promoterBot.getConfig()
        return promoterBotConfig
    }

    async sendMessage(botId: string, to: string, message: string): Promise<void> {
        const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(botId)
        notifyBot.sendMessage(to, message)
    }

    async sendMessageWithImage(botId: string, to: string, message: string | null, filePath: string): Promise<void> {
        const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(botId)
        notifyBot.sendMessageWithImage(to, message, filePath)
    }

    async createGroup(createGroupInfo: CreateGroupInfo): Promise<GroupInfo> {
        const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(createGroupInfo.botId)
        const groupId: string = await notifyBot.createGroup(
            createGroupInfo.title,
            createGroupInfo.description,
            createGroupInfo.imgProfileUrl,
            createGroupInfo.superAdmins
        )

        const participants: Participant[] = createGroupInfo.superAdmins.map(
            element => {
                const participant: Participant = {
                    phone: element,
                    isAdmin: true
                }
                return participant
            }
        )

        const group: Group = {
            _id: new ObjectId(),
            groupId: groupId,
            botId: createGroupInfo.botId,
            title: createGroupInfo.title,
            description: createGroupInfo.description,
            imgProfileUrl: createGroupInfo.imgProfileUrl,
            superAdmins: createGroupInfo.superAdmins,
            participants: participants,
            createdAt: new Date().toDateString()
        }

        this.mongodb.register<Group>(CollectionsInDb.Groups, group)
        return this.groupInfoFactory(group)
    }

    private groupInfoFactory(group: Group): GroupInfo {
        const groupInfo: GroupInfo = {
            id: group.groupId,
            botId: group.botId,
            title: group.title,
            description: group.description,
            imgProfileUrl: group.imgProfileUrl,
            participants: group.participants,
            createdAt: group.createdAt
        }

        return groupInfo
    }

    async getGroupById(botId: string, groupId: string): Promise<GroupInfo> {
        const norifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(botId)
        const groupChat: GroupChat = await norifyBot.returnGroupById(groupId)
        const groupInfo: GroupInfo = await this.groupInfoFactoryWithParticipantsUpdated(botId, groupChat)
        return groupInfo
    }

    async getAllGroupsFromTheBot(botId: string): Promise<GroupInfo[]> {
        const botMongodb: BotMongodb | null = await this.mongodb.return<BotMongodb>(CollectionsInDb.Bots, { _id: new ObjectId(botId) })
        if (!botMongodb) { throw new Error(Errors.BotNotFound) }
        let bot: AbstractNotifyBot<Client | Whatsapp> | PromoterBot | undefined

        if (botMongodb.botType === BotType.NOTIFY_BOT) {
            bot = DefaultRepository.notifyBots.find(element => element.id === botId)
        } else {
            bot = DefaultRepository.promoterBots.find(element => element.id === botId)
        }
        if (!bot) {
            return []
        }

        const groups: Group[] = await this.mongodb.returnAllWithQuery<Group>(CollectionsInDb.Groups, { [Fields.BotId]: botId })
        const groupInfoList: GroupInfo[] = await Promise.all(groups.map(async (group) => {
            const groupChat: GroupChat = await bot.returnGroupById(group.groupId)
            return this.groupInfoFactoryWithParticipantsUpdated(botId, groupChat)
        }))

        return groupInfoList
    }

    private async groupInfoFactoryWithParticipantsUpdated(botId: string, groupChat: GroupChat): Promise<GroupInfo> {
        const norifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(botId)
        const group: GroupChat = await norifyBot.returnGroupById(groupChat.id.user)

        let participants: Participant[] = []
        for (const participant of group.participants) {
            let participantResponse: Participant = {
                phone: participant.id.user,
                isAdmin: participant.isAdmin
            }
            participants.push(participantResponse)
        }

        const groupInfo: GroupInfo = {
            id: group.id.user,
            botId: botId,
            title: group.name,
            description: group.description,
            imgProfileUrl: norifyBot.profileImage,
            participants: participants,
            createdAt: group.createdAt.toDateString()
        }

        return groupInfo
    }

    async deleteGroupById(botId: string, groupId: string): Promise<void> {
        const norifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(botId)
        norifyBot.deleteGroup(groupId)
    }

    async addParticipantToTheGroup(info: DataForActionWithParticipant): Promise<void> {
        const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(info.botId)
        notifyBot.addParticipantToGroup(info.groupId, info.phone)
    }

    async removeParticipantFromTheGroup(info: DataForActionWithParticipant): Promise<void> {
        const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(info.botId)
        notifyBot.removeParticipantFromTheGroup(info.groupId, info.phone)
    }

    async sendMessageTotheGroup(info: SendMessageInfo): Promise<void> {
        const notifyBot: AbstractNotifyBot<Client | Whatsapp> = this.getNotifyBot(info.botId)
        notifyBot.sendMessageToTheGroup(info.to, info.message)
    }

}