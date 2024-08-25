import { PossibleChatPromoterBotConfig } from "./PossibleChatPromoterBotConfig"

export interface PromoterBotConfig {
    automaticMessagePermission?: boolean
    automaticMessage?: string
    callPermission?: boolean
    automaticCallMessage?: string
    welcomeMessage?: string
    leaveMessage?: string
    messageFlooding?: string
    flooding?: boolean
    blockZap?: boolean
    queueRabbitMqPermission?: boolean
    queueRabbitMqBotStatus?: string
    responseTextContext?: Map<string, string[]>
    possibleChat?: PossibleChatPromoterBotConfig
}