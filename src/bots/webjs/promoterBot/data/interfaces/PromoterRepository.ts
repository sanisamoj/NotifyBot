import { SavedPhone } from "./SavedPhone";

export abstract class PromoterRepository {
    abstract registerPhone(phone: string): Promise<void>
    abstract getAllPhones(): Promise<SavedPhone[]>
    abstract getAllPhonesWithPagination(page: number, size: number): Promise<SavedPhone[]>
}