import { Config } from "../../Config"
import { Fields } from "../../data/models/enums/Fields"
import { DatabaseRepository } from "../../data/models/interfaces/DatabaseRepository"
import { HandleMessageInfo } from "../../data/models/interfaces/HandleMessageInfo"
import { NotifyBotConfig } from "../../data/models/interfaces/NotifyBotConfig"
import { NotifyBotStatus } from "../../data/models/interfaces/NotifyBotStatus"
import { RabbitMQService } from "../../services/RabbitMQService"

export class NotifyBotService {
    private repository: DatabaseRepository

    constructor(database: DatabaseRepository = Config.getDatabaseRepository()) {
        this.repository = database
    }

    async updateBotConfig(botId: string, config: NotifyBotConfig | null) {
        this.repository.updateBotConfig(botId, config)
    }

    async setNumber(botId: string, phoneNumber: string) {
        this.repository.updateBot(botId, Fields.Number, phoneNumber)
    }

    async deleteBot(botId: string) {
        this.repository.deleteBot(botId)
    }

    async sendHandleMessageInfoToRabbitMQ(queue: string, handleMessageInfo: HandleMessageInfo) {
        const rabbitMQService: RabbitMQService = await RabbitMQService.getInstance()
        await rabbitMQService.sendMessage(queue, handleMessageInfo)
    }

    async setBotStatus(notifyBotStatus: NotifyBotStatus) {
        await this.repository.updateBot(notifyBotStatus.botId, Fields.Status, notifyBotStatus.status)
    }

    async notifyToRabbitMQ(queue: string, notifyBotStatus: NotifyBotStatus) {
        const rabbitMQService: RabbitMQService = await RabbitMQService.getInstance()
        try { await rabbitMQService.sendMessage(queue, notifyBotStatus) } catch {}
    }
}