import { RouteShorthandOptions } from "fastify"
import { TokenValidator } from "./middleware/TokenValidator"
import { BotController } from "./controllers/BotController"
import { ErrorsController } from "./controllers/ErrorsController"
import { AdminController } from "./controllers/AdminController"
import { rateLimitAdminLogin, rateLimitLightweight } from "./utils/rateLimitConfig"

export async function routes(fastify: any, options: RouteShorthandOptions): Promise<void> {
    const authentication: TokenValidator = new TokenValidator()

    fastify.setErrorHandler(function (error: any, request: any, reply: any) {
        new ErrorsController().globalFastifyError(error, reply)
    })

    // Rota responsável por criar um bot
    fastify.post("/bot", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().createBot)
    // Rota responsável por deletar um bot
    fastify.delete("/bot/:id", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().deleteBot)
    // Rota responsável por parar um bot
    fastify.post("/bot/:id/stop", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().stopBot)
    // Rota responsável por parar todos os bots
    fastify.post("/bot/all/stop", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().stopAllBots)
    // Rota responsável por reiniciar um bot
    fastify.post("/bot/:id/restart", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().restartBot)
    // Rota responsável por reiniciar todos os bots
    fastify.post("/bot/restart", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().restartAllBot)
    // Rota responsável por iniciar os bots de emergência
    fastify.post("/emergency/bots", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().initializeEmergencyBots)
    // Rota responsável por inicia um bot de emergência
    fastify.post("/emergency/bot/:id", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().initializeEmergencyBot)
    // Rota responsável por alterar as configurações do bot
    fastify.put("/bot", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().updateBotConfig)
    // Rota responsável por enviar uma mensagem com o bot
    fastify.post("/bot/:id/message", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().sendMessage)
    // Rota responsável por enviar uma mensagem com imagem com o bot
    fastify.post("/bot/:id/img-message", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().sendMessageWithImage)
    // Rota responsável por enviar uma mensagem com uma url de imagem com o bot
    fastify.post("/bot/:id/img-url-message", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().sendMessageWithImageUrl)
    // Rota responsável por enviar uma mensagem com imagem com o bot para um grupo
    fastify.post("/bot/:id/img-message-group", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().sendMessageWithImageToTheGroup)
    // Rota responsável por enviar uma mensagem com uma url de imagem com o bot para um grupo
    fastify.post("/bot/:id/img-url-message-group", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().sendMessageWithImageUrlToTheGroup)
    // Rota responsável por ataulizar a imagem de perfil do bot
    fastify.put("/bot/:id/img-profile", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().updateImageProfile)
    // Rota responsável por enviar uma mensagem para um grupo
    fastify.post("/bot/:id/group/message", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().sendMessageToGroup)
    // Rota responsável por retornar um bot
    fastify.get("/bot/:id", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().getBotById)
    // Rota responsável por retornar todos os bots
    fastify.get("/bot", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().getAllbots)
    // Rota responsável por criar um grupo
    fastify.post("/bot/:id/group", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().createGroup)
    // Rota responsável retornar um grupo pelo ID
    fastify.get("/bot/:id/group/:groupId", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().returnGroupById)
    // Rota responsável por adicionar um participante ao grupo
    fastify.post("/bot/:id/group/:groupId/add/:phone", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().addParticipantToGroup)
    // Rota responsável por remover um participante do grupo
    fastify.delete("/bot/:id/group/:groupId/remove/:phone", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().removeParticipantToGroup)
    // Rota responsável por remover um grupo
    fastify.delete("/bot/:id/group/:groupId", { preHandler: [authentication.isAdminAuthenticated], config: rateLimitLightweight }, new BotController().groupDelete)

    // Rotas de admin

    // Rota respónsável por retornar o token do admin
    fastify.post("/admin", { config: rateLimitAdminLogin }, new AdminController().login)
}