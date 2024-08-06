import { BotInfo } from "./BotInfo";
import { PaginationResponse } from "./PaginationResponse";

export interface BotInfoWithPagination{
    bots: BotInfo[]
    pagination: PaginationResponse
}