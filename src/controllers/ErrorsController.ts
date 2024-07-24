import { FastifyError, FastifyReply } from "fastify"
import { ErrorResponse } from "../data/models/interfaces/ErrorResponse"
import { errorResponse } from "../error/errorResponse"

export class ErrorsController {
    async globalFastifyError(error: FastifyError, reply: FastifyReply): Promise<void> {
        let response: ErrorResponse = errorResponse(error.message)
        return reply.status(response.statusCode).send(response)
    }
}