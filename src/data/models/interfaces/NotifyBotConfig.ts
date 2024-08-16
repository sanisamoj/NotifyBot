export interface NotifyBotConfig {
    automaticMessagePermission: boolean | null
    automaticMessage: string | null
    callPermission: boolean | null
    automaticCallMessage: string | null
    queueRabbitMqPermission: boolean | null
    queueRabbitMqHandleMessage: string | null
    queueRabbitMqBotStatus: string | null
}