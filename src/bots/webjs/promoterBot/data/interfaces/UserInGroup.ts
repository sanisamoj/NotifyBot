import { MessageHistory } from "./MessageHistory"

export interface UserInGroup {
    phone: string
    messageHistoryList: MessageHistory[]
}