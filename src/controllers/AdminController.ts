import { FastifyReply, FastifyRequest } from "fastify";
import { AdminCredentialsRequest } from "../data/models/interfaces/AdminCredentialsRequest";
import { AdminLoginResponse } from "../data/models/interfaces/AdminLoginResponse";
import { AdminService } from "../services/AdminService";

export class AdminController {
    async login(request: FastifyRequest, reply: FastifyReply) {
        const adminCredentialsRequest: AdminCredentialsRequest = request.body as AdminCredentialsRequest
        const adminLoginResponse: AdminLoginResponse = await new AdminService().login(adminCredentialsRequest.email, adminCredentialsRequest.password)
        return reply.status(200).send(adminLoginResponse)
    }
}