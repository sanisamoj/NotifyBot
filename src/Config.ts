import { DatabaseRepository } from "./data/models/interfaces/DatabaseRepository"
import { DefaultRepository } from "./data/repository/DefaultRepository"

export class Config {
  static systemVersion: string = "0.10.4"
  static SAVE_BOTS_FILE_PATH: string = "./savedBots"
  static SAVE_VENOM_BOTS_FILE_PATH: string = "./savedVenomBots"

  private static databaseRepository: DefaultRepository = new DefaultRepository()

  static getDatabaseRepository(): DatabaseRepository {
    return Config.databaseRepository
  }

  static async destroyAllBots() {
    Config.databaseRepository.destroyAllBots()
  }

  static async stopAllBots() {
    Config.databaseRepository.stopAllBots()
  }

  static async initializeAllBots() {
    Config.databaseRepository.initializeAllBots()
  }
}