import { CollectionsInDb } from "../../../../../data/models/enums/CollectionsInDb"
import { MongodbOperations } from "../../../../../database/MongodbOperations"
import { PromoterRepository } from "../interfaces/PromoterRepository"
import { SavedPhone } from "../interfaces/SavedPhone"

export class PromoterBotRepository extends PromoterRepository {
    private mongodb: MongodbOperations = new MongodbOperations()

    async registerPhone(phone: string): Promise<void> {
        const savedPhone: SavedPhone = { phone: phone, savedAt: new Date().toDateString() }
        this.mongodb.register<SavedPhone>(CollectionsInDb.Phones, savedPhone)
    }

    async getAllPhones(): Promise<SavedPhone[]> {
        return this.mongodb.returnAll<SavedPhone>(CollectionsInDb.Phones)
    }

    async getAllPhonesWithPagination(page: number, size: number): Promise<SavedPhone[]> {
        return this.mongodb.returnAllWithPagination<SavedPhone>(CollectionsInDb.Phones, page, size)
    }

}