export interface PromoterBotConfig {
    automaticMessagePermission: boolean | null
    automaticMessage: string | null
    callPermission: boolean | null
    automaticCallMessage: string | null
    welcomerMessage: string | null
    queueRabbitMqPermission: boolean | null
    queueRabbitMqBotStatus: string | null
}