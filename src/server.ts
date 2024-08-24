import Fastify, { FastifyInstance } from "fastify"
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import cors from '@fastify/cors'
import { routes } from "./routes"
import { Config } from "./Config"
import * as dotenv from 'dotenv'

dotenv.config()

const fastify: FastifyInstance = Fastify({
    logger: true,
    disableRequestLogging: true
})

fastify.register(multipart, {
    limits: {
        fieldNameSize: 100, // Max field name size in bytes
        fieldSize: 100,     // Max field value size in bytes
        fields: 10,         // Max number of non-file fields
        fileSize: 5000000,  // For multipart forms, the max file size in bytes
        files: 1,           // Max number of file fields
        headerPairs: 1000,  // Max number of header key=>value pairs
        parts: 1000         // For multipart forms, the max number of parts (fields + files)
    }
})

fastify.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
})

fastify.register(rateLimit)
fastify.register(routes)



const start = async () => {
    try {
        const port: string = process.env.PORT as string
        await fastify.listen({ port: parseInt(port), host: "0.0.0.0" })
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
    } catch (error) {
        console.error(error)
    } finally {
        process.exit()
    }
})

process.on('SIGTERM', () => {
    console.log('Closing application!')
    process.exit()
})

export default fastify