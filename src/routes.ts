import {RouteShorthandOptions} from "fastify";
import {TokenValidator} from "./middleware/TokenValidator";
import { ErrorsController } from "./controllers/ErrorsController";
import { BotController } from "./controllers/BotController";

export async function routes(fastify: any, options: RouteShorthandOptions): Promise<void> {
    const authentication: TokenValidator = new TokenValidator()

    // Erro global não tratado
    fastify.setErrorHandler(new ErrorsController().globalFastifyError)

    // Rota responsável por criar um bot
    fastify.post("/bot", { preHandler: [authentication.isAuthenticated] }, new BotController().createBot)
    // Rota responsável por deletar um bot
    fastify.delete("/bot/:id", { preHandler: [authentication.isAuthenticated] }, new BotController().deleteBot)
    // Rota responsável por enviar uma mensagem com o bot
    fastify.post("/bot/:id/message", { preHandler: [authentication.isAuthenticated] }, new BotController().sendMessage)
    // Rota responsável por enviar uma mensagem para um grupo
    fastify.post("/bot/:id/group/message", { preHandler: [authentication.isAuthenticated] }, new BotController().sendMessageToGroup)
    // Rota responsável por retornar um bot
    fastify.get("/bot/:id", { preHandler: [authentication.isAuthenticated] }, new BotController().returnBotById)
    // Rota responsável por criar um grupo
    fastify.post("/bot/:id/group", { preHandler: [authentication.isAuthenticated] }, new BotController().createGroup)
    // Rota responsável retornar um grupo pelo ID
    fastify.get("/bot/:id/group/:groupId", { preHandler: [authentication.isAuthenticated] }, new BotController().returnGroupById)
    // Rota responsável por adicionar um participante ao grupo
    fastify.post("/bot/:id/group/:groupId/add/:phone", { preHandler: [authentication.isAuthenticated] }, new BotController().addParticipantToGroup)
    // Rota responsável por remover um participante do grupo
    fastify.delete("/bot/:id/group/:groupId/remove/:phone", { preHandler: [authentication.isAuthenticated] }, new BotController().removeParticipantToGroup)
    // Rota responsável por remover um grupo
    fastify.delete("/bot/:id/group/:groupId", { preHandler: [authentication.isAuthenticated] }, new BotController().groupDelete)

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