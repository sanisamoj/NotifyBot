import { FastifyReply, FastifyRequest } from "fastify"
import { CreateBotRequest } from "../data/models/interfaces/CreateBotRequest"
import { SendMessageRequest } from "../data/models/interfaces/SendMessageRequest"
import { CreateGroupRequest } from "../data/models/interfaces/CreateGroupRequest"
import { CreateGroupInfo } from "../data/models/interfaces/CreateGroupInfo"
import { DataForActionWithParticipant } from "../data/models/interfaces/DataForActionWithParticipant"
import { SendMessageInfo } from "../data/models/interfaces/SendMessageInfo"
import { BotService } from "../services/BotService"
import { BotInfo } from "../data/models/interfaces/BotInfo"
import { GroupInfo } from "../data/models/interfaces/GroupInfo"
import { UpdateBotConfigRequest } from "../data/models/interfaces/UpdateBotConfigRequest"
import { NotifyBotConfig } from "../data/models/interfaces/NotifyBotConfig"
import { BotInfoWithPagination } from "../data/models/interfaces/BotInfoWithPagination"

export class BotController {
    async createBot(request: FastifyRequest, reply: FastifyReply) {
        const createBotRequest = request.body as CreateBotRequest
        const botInfo: BotInfo = await new BotService().createBot(createBotRequest)
        return reply.status(201).send(botInfo)
    }

    async deleteBot(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        await new BotService().deleteBotById(id)
        return reply.status(200).send()
    }

    async stopBot(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        await new BotService().stopBotById(id)
        return reply.status(200).send()
    }

    async restartBot(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        await new BotService().restartBotById(id)
        return reply.status(200).send()
    }

    async initializeEmergencyBots(request: FastifyRequest, reply: FastifyReply) {
        await new BotService().initializeEmergencyBots()
        return reply.status(200).send()
    }

    async stopEmergencyBots(request: FastifyRequest, reply: FastifyReply) {
        await new BotService().stopEmergencyBots()
        return reply.status(200).send()
    }

    async sendMessage(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const { phone, message } = request.body as any

        const sendMessageRequest: SendMessageRequest = {
            botId: id,
            phone: phone,
            message: message
        }

        await new BotService().sendMessage(sendMessageRequest)
        return reply.status(200).send()
    }

    async getBotById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const botInfo: BotInfo = await new BotService().getBotById(id)
        return reply.send(botInfo)
    }

    async getAllbots(request: FastifyRequest, reply: FastifyReply) {
        const { page, size } = request.query as { page?: string; size?: string }

        if (page === undefined || size === undefined) {
            const botInfoList: BotInfo[] = await new BotService().getAllBots()
            return reply.send(botInfoList)
        }

        const pageNumber = Number(page)
        const sizeNumber = Number(size)

        if (isNaN(pageNumber) || isNaN(sizeNumber) || pageNumber <= 0 || sizeNumber <= 0) {
            return reply.status(400).send({ error: 'Invalid page or size parameters. They must be positive numbers.' })
        }

        const botsInfoList: BotInfoWithPagination = await new BotService().getAllBotsWithPagination(pageNumber, sizeNumber)
        return reply.send(botsInfoList)
    }

    async createGroup(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as any
        const createGroupRequest = request.body as CreateGroupRequest

        const createGroupInfo: CreateGroupInfo = {
            botId: id,
            title: createGroupRequest.title,
            description: createGroupRequest.description,
            imgProfileUrl: createGroupRequest.imgProfileUrl,
            superAdmins: createGroupRequest.superAdmins
        }

        const groupInfo: GroupInfo = await new BotService().createGroup(createGroupInfo)
        return reply.status(201).send(groupInfo)
    }

    async returnGroupById(request: FastifyRequest, reply: FastifyReply) {
        const { id, groupId } = request.params as any
        const groupInfo: GroupInfo = await new BotService().getGroupById(id, groupId)

        return reply.status(200).send(groupInfo)
    }

    async returnGroupsFromTheBot(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as any
        const groupsInfo: GroupInfo[] = await new BotService().getAllGroupsFromTheBot(id)

        return reply.status(200).send(groupsInfo)
    }

    async addParticipantToGroup(request: FastifyRequest, reply: FastifyReply) {
        const { id, groupId, phone } = request.params as any
        const dataForActionWithParticipant: DataForActionWithParticipant = {
            botId: id,
            groupId: groupId,
            phone: phone
        }
        await new BotService().addParticipantToTheGroup(dataForActionWithParticipant)

        return reply.status(200).send()
    }

    async removeParticipantToGroup(request: FastifyRequest, reply: FastifyReply) {
        const { id, groupId, phone } = request.params as any
        const dataForActionWithParticipant: DataForActionWithParticipant = {
            botId: id,
            groupId: groupId,
            phone: phone
        }
        await new BotService().removeParticipantFromTheGroup(dataForActionWithParticipant)

        return reply.status(200).send()
    }

    async groupDelete(request: FastifyRequest, reply: FastifyReply) {
        const { id, groupId } = request.params as any
        await new BotService().deleteGroup(id, groupId)
        reply.status(200).send()
    }

    async sendMessageToGroup(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as any
        const { groupId, message } = request.body as any
        const sendMessageInfo: SendMessageInfo = {
            botId: id,
            to: groupId,
            message: message
        }
        await new BotService().sendMessageToGroup(sendMessageInfo)

        return reply.status(200).send()
    }

    async updateBotConfig(request: FastifyRequest, reply: FastifyReply) {
        const updateBotConfigRequest: UpdateBotConfigRequest = request.body as UpdateBotConfigRequest
        const response: NotifyBotConfig | null = await new BotService().updateNotifyBotConfig(updateBotConfigRequest.botId, updateBotConfigRequest.config)
        if (response) {
            reply.status(200).send(response)
        } else {
            reply.send(200).send()
        }
    }
}