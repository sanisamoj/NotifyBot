import { CollectionsInDb } from "../../../../data/models/enums/CollectionsInDb"
import { MongodbOperations } from "../../../../database/MongodbOperations"
import { PromoterGroup } from "../data/interfaces/MeduzaGroup"

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
}