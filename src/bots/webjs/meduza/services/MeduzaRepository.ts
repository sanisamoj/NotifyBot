import { CollectionsInDb } from "../../../../data/models/enums/CollectionsInDb"
import { MongodbOperations } from "../../../../database/MongodbOperations"
import { MeduzaGroup } from "../data/interfaces/MeduzaGroup"

export class MeduzaRepository {
    private mongodb: MongodbOperations = new MongodbOperations()

    async registerGroup(meduzaGroup: MeduzaGroup) {
        await this.mongodb.register<MeduzaGroup>(CollectionsInDb.MeduzaGroups, meduzaGroup)
    }

    async getGroup(groupId: string) {
        const meduzaGroup: MeduzaGroup | null = await this.mongodb.return<MeduzaGroup>(CollectionsInDb.MeduzaGroups, { botId: groupId })
        if (!meduzaGroup) { throw new Error() }
        return meduzaGroup
    }
}