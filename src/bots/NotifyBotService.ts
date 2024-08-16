import { Config } from "../Config"
import { Fields } from "../data/models/enums/Fields"
import { DatabaseRepository } from "../data/models/interfaces/DatabaseRepository"
import { NotifyBotConfig } from "../data/models/interfaces/NotifyBotConfig"

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
}