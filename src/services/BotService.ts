import { Config } from "../Config";
import { DatabaseRepository } from "../data/models/interfaces/DatabaseRepository";

export class BotService {
    private database: DatabaseRepository

    constructor(database: DatabaseRepository = Config.getDatabaseRepository()) {
        this.database = database
    }
}