import * as amqp from 'amqplib'

export class RabbitMQService {
    private static instance: RabbitMQService
    private connection!: amqp.Connection
    private channel!: amqp.Channel

    private host: string = process.env.RABBITMQ_HOST as string

    private constructor() { }

    public static async getInstance(): Promise<RabbitMQService> {
        if (!RabbitMQService.instance) {
            RabbitMQService.instance = new RabbitMQService()
            await RabbitMQService.instance.connect()
        }
        return RabbitMQService.instance
    }

    private async connect() {
        this.connection = await amqp.connect(this.host)
        this.channel = await this.connection.createChannel()
    }

    public async sendMessage<T>(queueName: string, message: T) {
        await this.channel.assertQueue(queueName, { durable: true })
        const messageJson: string = JSON.stringify(message)
        this.channel.sendToQueue(queueName, Buffer.from(messageJson), { persistent: true })
    }

    public async consumeMessage<T>(queueName: string, onMessage: (message: T) => void) {
        await this.channel.assertQueue(queueName, { durable: true })

        this.channel.consume(queueName, (msg) => {
            try {
                if (msg !== null) {
                    const messageJson = msg.content.toString()
                    const message = JSON.parse(messageJson) as T
                    onMessage(message)
                    this.channel.ack(msg)
                }
            } catch (error) {
                console.log(error)
            }
        }, { noAck: false })
    }

    public async closeConnection() {
        await this.channel.close()
        await this.connection.close()
    }
}