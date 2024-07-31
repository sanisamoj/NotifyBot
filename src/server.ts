import Fastify, { FastifyInstance } from "fastify"
import rateLimit from '@fastify/rate-limit'
import cors from '@fastify/cors'
import { routes } from "./routes"
import { Config } from "./Config"

const fastify: FastifyInstance = Fastify({
    logger: true,
    disableRequestLogging: true
})

fastify.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
})

fastify.register(rateLimit)
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
Config.initializeAllBots()

process.on('uncaughtException', (error, origin) => {
    console.log(`\n${origin} signal received. \n${error}`)
    
})

process.on('unhandledRejection', (error) => {
    console.log(`unhandledRejection signal received. \n${error}`)
})

process.on('SIGINT', async () => {
    try {
        await Config.stopAllBots()
        console.log('Todos os bots foram fechados.')
    } catch (error) {
        console.error('Erro ao fechar os bots:', error)
    } finally {
        process.exit()
    }
})

process.on('SIGTERM', () => {
    console.log('Encerrando aplicação!')
    process.exit()
})

export default fastify