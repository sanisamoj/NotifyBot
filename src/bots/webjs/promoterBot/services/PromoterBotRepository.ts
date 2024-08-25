import { ObjectId } from "mongodb"
import { CollectionsInDb } from "../../../../data/models/enums/CollectionsInDb"
import { BotMongodb } from "../../../../data/models/interfaces/BotMongodb"
import { MongodbOperations } from "../../../../database/MongodbOperations"
import { PromoterGroup } from "../data/interfaces/MeduzaGroup"
import { PromoterBotConfig } from "../data/interfaces/PromoterBotConfig"
import { Fields } from "../../../../data/models/enums/Fields"

export class PromoterBotRepository {
    private mongodb: MongodbOperations = new MongodbOperations()

    async registerGroup(promoterGroup: PromoterGroup) {
        await this.mongodb.register<PromoterGroup>(CollectionsInDb.PromoterGroups, promoterGroup)
    }

    async getGroup(groupId: string) {
        const PromoterGroup: PromoterGroup | null = await this.mongodb.return<PromoterGroup>(CollectionsInDb.PromoterGroups, { botId: groupId })
        if (!PromoterGroup) { throw new Error() }
        return PromoterGroup
    }

    async updatePromoterBotConfig(botId: string, config: PromoterBotConfig): Promise<void> {
        await this.mongodb.update<BotMongodb>(CollectionsInDb.Bots, { [Fields.Id]: new ObjectId(botId) }, { config: config })
    }
}