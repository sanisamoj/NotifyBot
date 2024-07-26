import { NotifyBotConfig } from "./NotifyBotConfig"

export interface BotInfo {
    id: string
    name: string
    description: string
    number: string
    profileImageUrl: string
    qrCode: string
    groupsId: string[]
    config: NotifyBotConfig | null
    createdAt: string
}