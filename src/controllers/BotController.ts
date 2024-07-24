import {FastifyReply, FastifyRequest} from "fastify"
import { CreateBotRequest } from "../data/models/interfaces/CreateBotRequest"
import { SendMessageRequest } from "../data/models/interfaces/SendMessageRequest"
import { CreateGroupRequest } from "../data/models/interfaces/CreateGroupRequest"
import { CreateGroupInfo } from "../data/models/interfaces/CreateGroupInfo"
import { DataForActionWithParticipant } from "../data/models/interfaces/DataForActionWithParticipant"
import { SendMessageInfo } from "../data/models/interfaces/SendMessageInfo"
import { BotService } from "../services/BotService"
import { BotInfo } from "../data/models/interfaces/BotInfo"
import { GroupInfo } from "../data/models/interfaces/GroupInfo"

export class BotController {
    async createBot(request: FastifyRequest, reply: FastifyReply) {
        const createBotRequest = request.body as CreateBotRequest
        const botInfo: BotInfo = await new BotService().createBot(createBotRequest)
        return reply.status(201).send(botInfo)
    }

    async deleteBot(request: FastifyRequest, reply: FastifyReply) {
        const {id} = request.params as any
        await new BotService().deleteBotById(id)
        return reply.status(200).send()
    }

    async sendMessage(request: FastifyRequest, reply: FastifyReply) {
        const {id} = request.params as any
        const {phone, message} = request.body as any

        const sendMessageRequest: SendMessageRequest = {
            botId: id,
            phone: phone,
            message: message
        }
        
        new BotService().sendMessage(sendMessageRequest)
        return reply.status(200).send()
    }

    async returnBotById(request: FastifyRequest, reply: FastifyReply) {
        const {id} = request.params as any
        const botInfo: BotInfo = await new BotService().getBotById(id)
        return reply.send(botInfo)
    }

    async createGroup(request: FastifyRequest, reply: FastifyReply) {
        const {id} = request.params as any
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
        const {id, groupId} = request.params as any

    }

    async addParticipantToGroup(request: FastifyRequest, reply: FastifyReply) {
        const {id, groupId, phone} = request.params as any
        const dataForActionWithParticipant: DataForActionWithParticipant = {
            botId: id,
            groupId: groupId,
            phone: phone
        }
    }

    async removeParticipantToGroup(request: FastifyRequest, reply: FastifyReply) {
        const {id, groupId, phone} = request.params as any
        const dataForActionWithParticipant: DataForActionWithParticipant = {
            botId: id,
            groupId: groupId,
            phone: phone
        }

    }

    async groupDelete(request: FastifyRequest, reply: FastifyReply) {
        const {id, groupId} = request.params as any
    }

    async sendMessageToGroup(request: FastifyRequest, reply: FastifyReply) {
        const {id} = request.params as any
        const {groupId, message} = request.body as any
        const sendMessageInfo: SendMessageInfo = {
            botId: id,
            to: groupId,
            message: message
        }

    }
}