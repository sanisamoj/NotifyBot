import { PaginationResponse } from "../data/models/interfaces/PaginationResponse"

export function paginationMethod(totalItems: number, pageSize: number, page: number): PaginationResponse {
    const totalPages = Math.ceil(totalItems / pageSize)
    const remainingPage = totalPages - page

    const response: PaginationResponse = {
        totalPages: totalPages,
        remainingPage: remainingPage
    }

    return response
}