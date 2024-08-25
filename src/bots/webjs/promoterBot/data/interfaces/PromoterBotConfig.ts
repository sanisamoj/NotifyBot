export interface PromoterBotConfig {
    automaticMessagePermission: boolean | null
    automaticMessage: string | null
    callPermission: boolean | null
    automaticCallMessage: string | null
    welcomeMessage: string | null
    leaveMessage: string | null
    messageFlooding: string | null
    flooding: boolean | null
    blockZap: boolean | null
    queueRabbitMqPermission: boolean | null
    queueRabbitMqBotStatus: string | null
}