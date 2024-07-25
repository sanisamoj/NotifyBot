import {RouteShorthandOptions} from "fastify"
import {TokenValidator} from "./middleware/TokenValidator"
import { BotController } from "./controllers/BotController"

export async function routes(fastify: any, options: RouteShorthandOptions): Promise<void> {
    const authentication: TokenValidator = new TokenValidator()

    // Rota responsável por criar um bot
    fastify.post("/bot", new BotController().createBot)
    // Rota responsável por deletar um bot
    fastify.delete("/bot/:id", new BotController().deleteBot)
    // Rota responsável por enviar uma mensagem com o bot
    fastify.post("/bot/:id/message", new BotController().sendMessage)
    // Rota responsável por enviar uma mensagem para um grupo
    fastify.post("/bot/:id/group/message", new BotController().sendMessageToGroup)
    // Rota responsável por retornar um bot
    fastify.get("/bot/:id", new BotController().returnBotById)
    // Rota responsável por criar um grupo
    fastify.post("/bot/:id/group", new BotController().createGroup)
    // Rota responsável retornar um grupo pelo ID
    fastify.get("/bot/:id/group/:groupId", new BotController().returnGroupById)
    // Rota responsável por adicionar um participante ao grupo
    fastify.post("/bot/:id/group/:groupId/add/:phone", new BotController().addParticipantToGroup)
    // Rota responsável por remover um participante do grupo
    fastify.delete("/bot/:id/group/:groupId/remove/:phone", new BotController().removeParticipantToGroup)
    // Rota responsável por remover um grupo
    fastify.delete("/bot/:id/group/:groupId", new BotController().groupDelete)

    // Rotas de usuários

    // // Rota respónsável por retornar o token do moderador
    // fastify.post("/moderator", new UserController().moderatorLogin)
    // // Rota responsável por criar um usuário
    // fastify.post("/user", { preHandler: [token.isAdminAuthenticated] }, new UserController().createUser)
    // // Rota responsável por deletar um usuário
    // fastify.delete("/user/:username", { preHandler: [token.isAdminAuthenticated] }, new UserController().deleteUserByUsername)
    // // Rota responsável por retornar o token do usuário
    // fastify.post("/login", new UserController().login)

}