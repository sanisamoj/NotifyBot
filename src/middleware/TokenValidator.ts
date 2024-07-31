import {FastifyReply, FastifyRequest} from "fastify";
import {Errors} from "../data/models/enums/Errors";
import jwt from "jsonwebtoken"

import {errorResponse} from "../error/errorResponse";
import { ErrorResponse } from "../data/models/interfaces/ErrorResponse";

export class TokenValidator {
    async isAuthenticated(request: FastifyRequest, reply: FastifyReply)  {
        const authToken: string | undefined = request.headers.authorization
        if(!authToken) {
            let response: ErrorResponse = errorResponse(Errors.InvalidToken)
            return reply.status(response.statusCode).send(response)
        }

        const [, token] = authToken.split(" ")

        try {
            const userSecret: string = process.env.SECRET_KEY as string
            const { sub } = jwt.verify(token, userSecret)

        } catch (error: any) {
            let response: ErrorResponse = errorResponse(error.message)
            return reply.status(response.statusCode).send(response)
        }
    }

    async isAdminAuthenticated(request: FastifyRequest, reply: FastifyReply): Promise<ErrorResponse | undefined>  {
        const authToken: string | undefined = request.headers.authorization
        if(!authToken) {
            let response: ErrorResponse = errorResponse(Errors.InvalidToken)
            return reply.status(response.statusCode).send(response)
        }

        const [, token] = authToken.split(" ")

        try {
            const moderatorSecret: string = process.env.ADMIN_SECRET_KEY as string
            const {sub } = jwt.verify(token, moderatorSecret)

        } catch (error: any) {
            let response: ErrorResponse = errorResponse(error.message)
            return reply.status(response.statusCode).send(response)
        }
    }
}