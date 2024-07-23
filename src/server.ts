import Fastify, {FastifyInstance} from "fastify"
import * as dotenv from 'dotenv'
import {routes} from "./routes"
import { BotCreateData } from "./data/models/interfaces/BotCreateData"
import { NotifyBot } from "./bots/NotifyBot"

dotenv.config()

const fastify : FastifyInstance = Fastify({
    logger: true,
    disableRequestLogging: true
})

fastify.register(routes)

// Inicia o servidor
const start = async () => {
    try {

        await fastify.listen({port: 9091, host: "0.0.0.0"})
        console.log('Servidor Principal | Online ✅')

    } catch (error) {
        fastify.log.error(error)
        process.exit
    }
}

start()

let botData: BotCreateData = {
    id: "string",
    name: "string",
    description: "string",
    profileImage: null,
    admins: []
}
new NotifyBot(botData)

// Trata os erros que não foram capturados internamente
process.on('uncaughtException', (error, origin) => {
    console.log(`\n${origin} signal received. \n${error}`)
})

process.on('unhandledRejection', (error) => {
    console.log(`unhandledRejection signal received. \n${error}`)
})

export default fastify