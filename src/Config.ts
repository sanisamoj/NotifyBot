import { DatabaseRepository } from "./data/models/interfaces/DatabaseRepository"
import { DefaultRepository } from "./data/repository/DefaultRepository"
import * as path from 'path'

export class Config {
  static systemVersion: string = "0.11.0"
  static SAVE_BOTS_FILE_PATH: string = "./savedBots"
  static SAVE_VENOM_BOTS_FILE_PATH: string = "./savedVenomBots"
  static UPLOAD_FOLDER: string = path.resolve(__dirname, "..", "temp")

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