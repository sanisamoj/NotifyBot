import { RouteShorthandOptions } from "fastify"
import { TokenValidator } from "./middleware/TokenValidator"
import { BotController } from "./controllers/BotController"
import { ErrorsController } from "./controllers/ErrorsController"
import { AdminController } from "./controllers/AdminController"

export async function routes(fastify: any, options: RouteShorthandOptions): Promise<void> {
    const authentication: TokenValidator = new TokenValidator()

    fastify.setErrorHandler(function (error: any, request: any, reply: any) {
        new ErrorsController().globalFastifyError(error, reply)
    })

    // Rota responsável por criar um bot
    fastify.post("/bot", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().createBot)
    // Rota responsável por deletar um bot
    fastify.delete("/bot/:id", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().deleteBot)
    // Rota responsável por enviar uma mensagem com o bot
    fastify.post("/bot/:id/message", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().sendMessage)
    // Rota responsável por enviar uma mensagem para um grupo
    fastify.post("/bot/:id/group/message", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().sendMessageToGroup)
    // Rota responsável por retornar um bot
    fastify.get("/bot/:id", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().returnBotById)
    // Rota responsável por criar um grupo
    fastify.post("/bot/:id/group", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().createGroup)
    // Rota responsável retornar um grupo pelo ID
    fastify.get("/bot/:id/group/:groupId", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().returnGroupById)
    // Rota responsável por adicionar um participante ao grupo
    fastify.post("/bot/:id/group/:groupId/add/:phone", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().addParticipantToGroup)
    // Rota responsável por remover um participante do grupo
    fastify.delete("/bot/:id/group/:groupId/remove/:phone", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().removeParticipantToGroup)
    // Rota responsável por remover um grupo
    fastify.delete("/bot/:id/group/:groupId", { preHandler: [authentication.isAdminAuthenticated] }, new BotController().groupDelete)



    // Rotas de admin

    // Rota respónsável por retornar o token do admin
    fastify.post("/admin", new AdminController().login)
}