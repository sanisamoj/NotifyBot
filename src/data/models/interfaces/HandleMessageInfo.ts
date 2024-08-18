export interface HandleMessageInfo {
    botId: string
    groupId: string | null
    from: string
    message: string
}