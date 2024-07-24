import { NotifyBot } from "./bots/NotifyBot"

export class Config {
    static systemVersion: string = "0.2.0"
    static SAVE_BOTS_FILE_PATH: string = "./savedBots"
    private static AllNotifyBots: NotifyBot[] = []
    
    static getAllNotifyBots() {
        return this.getAllNotifyBots
    }

    static addNotifyBot(notifyBot: NotifyBot) {
        const index = this.AllNotifyBots.findIndex(bot => bot.name === notifyBot.name)

        if (index === -1) {
          this.AllNotifyBots.push(notifyBot)
        } else {
          console.log(`Bot ${notifyBot.name} já existe na lista.`)
        }
    }

    static getNotifyBotById(id: string): NotifyBot | null {
        const bot = this.AllNotifyBots.find(element => element.id === id)
        return bot ? bot : null
    }
}