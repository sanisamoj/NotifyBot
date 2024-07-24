import Fastify, { FastifyInstance } from "fastify"
import { routes } from "./routes"
import { BotCreateData } from "./data/models/interfaces/BotCreateData"
import { Config } from "./Config"

const fastify: FastifyInstance = Fastify({
    logger: true,
    disableRequestLogging: true
})

fastify.register(routes)

const start = async () => {
    try {

        await fastify.listen({ port: 9091, host: "0.0.0.0" })
        console.log('Servidor Principal | Online ✅')

    } catch (error) {
        fastify.log.error(error)
        process.exit
    }
}

start()

let botData: BotCreateData = {
    id: "Medus3212sadza",
    name: "Meduza",
    description: "Nem tudo na vida é só 001001.",
    profileImage: null,
    admins: []
}

process.on('uncaughtException', (error, origin) => {
    console.log(`\n${origin} signal received. \n${error}`)
})

process.on('unhandledRejection', (error) => {
    console.log(`unhandledRejection signal received. \n${error}`)
})

process.on('SIGINT', async () => {
    try {
        await Config.closeAllBots();
        console.log('Todos os bots foram fechados.');
    } catch (error) {
        console.error('Erro ao fechar os bots:', error);
    } finally {
        process.exit();
    }
})

process.on('SIGTERM', () => {
    console.log('Encerrando aplicação!')
    process.exit()
})

export default fastify