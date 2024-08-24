import { PromoterBotConfig } from "../../../bots/webjs/promoterBot/data/interfaces/PromoterBotConfig"
import { NotifyBotConfig } from "./NotifyBotConfig"

export interface BotCreateData {
    id: string
    name: string
    description: string
    profileImage: string | null
    admins: string[]
    config: NotifyBotConfig | PromoterBotConfig | null
}