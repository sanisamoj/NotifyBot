import { NotifyBotConfig } from "./NotifyBotConfig"

export interface CreateBotRequest {
    name: string
    description: string
    profileImage: string | null
    admins: string[]
    config: NotifyBotConfig | null
    botType: string
}