import { GroupInfo } from "./GroupInfo"
import { NotifyBotConfig } from "./NotifyBotConfig"

export interface BotInfo {
    id: string
    name: string
    description: string
    number: string
    profileImageUrl: string
    qrCode: string
    groups: GroupInfo[]
    config: NotifyBotConfig | null
    status: string,
    createdAt: string
}