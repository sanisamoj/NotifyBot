import { DatabaseRepository } from "./data/models/interfaces/DatabaseRepository"
import { DefaultRepository } from "./data/repository/DefaultRepository"

export class Config {
  static systemVersion: string = "0.2.0"
  static SAVE_BOTS_FILE_PATH: string = "./savedBots"

  private static databaseRepository = new DefaultRepository()

  static getDatabaseRepository(): DatabaseRepository {
    return Config.databaseRepository
  }
}