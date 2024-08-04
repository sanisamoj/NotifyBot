import { NotifyBotConfig } from "./NotifyBotConfig"

export interface UpdateBotConfigRequest {
    botId: string
    config: NotifyBotConfig | null
}