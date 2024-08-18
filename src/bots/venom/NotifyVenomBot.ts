import { create, Whatsapp, Message, GroupCreation } from 'venom-bot'
import * as fsExtra from 'fs-extra'
import * as path from 'path'
import { NotifyBotConfig } from '../../data/models/interfaces/NotifyBotConfig'
import { Config } from '../../Config'
import { BotStatus } from '../../data/models/enums/BotStatus'
import { BotCreateData } from '../../data/models/interfaces/BotCreateData'
import { HandleMessageInfo } from '../../data/models/interfaces/HandleMessageInfo'
import { NotifyBotStatus } from '../../data/models/interfaces/NotifyBotStatus'
import { NotifyBotService } from '../services/NotifyBotService'

export class NotifyVenomBot {
    id: string
    name: string;
    description: string
    number: string = ""
    profileImage: string | null = null
    qrCode: string | undefined = undefined
    private config: NotifyBotConfig | null = null
    status: string = BotStatus.EMERGENCY

    private client!: Whatsapp
    private superAdmins: string[]

    constructor(botData: BotCreateData) {
        this.id = botData.id
        this.name = botData.name
        this.description = botData.description
        this.profileImage = botData.profileImage
        this.superAdmins = botData.admins
        this.config = botData.config

        create(`session-${this.id}`, (base64Qrimg) => {
            this.qrCode = base64Qrimg
        }, (statusSession, session) => {
            console.log('Status Session: ', statusSession) 

            if (statusSession === 'serverClose') {
                console.warn('WebSocket server was closed, taking action...')
                this.disconnect('serverClose')
            }

            if (statusSession === 'desconnectedMobile' || statusSession === "autocloseCalled") {
                this.disconnect('serverClose')
            }

            if (statusSession === 'notLogged') {
                this.disconnect('serverClose')
            }

            console.log('Session name: ', session)
        }, {
            mkdirFolderToken: Config.SAVE_VENOM_BOTS_FILE_PATH,
            headless: 'new'
        }).then((client) => {
            this.client = client
            this.start(client)
            this.onReady()
            this.onHandleMessages(client)
        }).catch((error) => {
            console.error(error)
        })
    }

    private async start(client: Whatsapp) {
        await client.setProfileStatus(this.description)
    }

    private async onReady() {
        console.log(`Bot ${this.number} | Online ✅`)
        const hostDevice: any = await this.client.getHostDevice()
        this.number = hostDevice.id.user
        new NotifyBotService().setNumber(this.id, this.number)

        this.status = BotStatus.EMERGENCY
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.EMERGENCY })
        this.sendMessageOfInitialization(this.client, this.name)
    }

    private async disconnect(reason: string) {
        console.log('Client was logged out', reason)
        this.status = BotStatus.DESTROYED
        this.qrCode = ""
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.DESTROYED })
        this.destroy()
    }

    private async sendMessageOfInitialization(client: Whatsapp, botName: string) {
        this.superAdmins.forEach(async element => {
            await client.sendText(`${element}@c.us`, `*Bot ${botName.toUpperCase()} Initialized*`)
        })
    }

    private async onHandleMessages(client: Whatsapp) {
        client.onMessage(async (message: Message) => {
            if (!this.config) return
    
            const isGroup: boolean = this.isGroupMessage(message)
    
            // Sending automatic messages
            if (this.config.automaticMessagePermission && this.config.automaticMessage) {
                await client.sendText(message.from, this.config.automaticMessage)
            }
    
            // Sending messages to RabbitMQ
            if (this.config.queueRabbitMqHandleMessage) {
                const handleMessageInfo: HandleMessageInfo = this.createHandleMessageInfo(message, isGroup)
                await this.sendHandleMessageInfoToRabbitMQ(handleMessageInfo)
            }
        })
    }

    private createHandleMessageInfo(message: Message, isGroup: boolean): HandleMessageInfo {
        const from: string = isGroup && message.author ? message.author.replace("@c.us", "") : message.from.replace("@c.us", "")
        const groupId: string | null = isGroup ? message.from.replace("@g.us", "") : null
    
        return {
            botId: this.id,
            groupId: groupId,
            from: from,
            message: message.body
        }
    }

    private isGroupMessage(message: Message): boolean {
        return (message.from.search('@g') === -1) ? false : true
    }

    private async sendHandleMessageInfoToRabbitMQ(handleMessageInfo: HandleMessageInfo) {
        const notifyBotService: NotifyBotService = new NotifyBotService()
        await notifyBotService.sendHandleMessageInfoToRabbitMQ(this.config?.queueRabbitMqHandleMessage!!, handleMessageInfo)
    }

    private async setNotifyBotStatus(notifyBotStatus: NotifyBotStatus) {
        const notifyBotService: NotifyBotService = new NotifyBotService()
        await notifyBotService.setStatusAndNotifyToRabbitMQ(this.config?.queueRabbitMqBotStatus!!, notifyBotStatus)
    }

    updateBotConfig(notifyBotConfig: NotifyBotConfig | null): void {
        this.config = notifyBotConfig
    }

    getBotConfig(): NotifyBotConfig | null {
        return this.config
    }

    async destroy(): Promise<void> {
        await this.client.close()
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.DESTROYED })
        const pathSave: string = path.join(`${Config.SAVE_VENOM_BOTS_FILE_PATH}/tokens`, `session-${this.id}`)

        if (fsExtra.existsSync(pathSave)) {
            try {
                fsExtra.removeSync(pathSave)
            } catch (error) {
                console.error(`Erro ao apagar a pasta: ${error}`)
            }
        }

        console.log(`Bot ${this.name} | Offline ⚠️`)
    }

    async stop(): Promise<void> {
        await this.client.close()
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.OFFLINE })
    }

    async sendMessage(sendTo: string, message: string): Promise<void> {
        await this.client.sendText(`${sendTo}@c.us`, message)
    }

}
