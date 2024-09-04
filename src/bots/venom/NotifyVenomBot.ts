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
import { AbstractNotifyBot } from '../../data/models/abstracts/AbstractNotifyBot'
import { GroupChat } from 'whatsapp-web.js'
import { Errors } from '../../data/models/enums/Errors'

export class NotifyVenomBot extends AbstractNotifyBot<Whatsapp> {
    constructor(botData: BotCreateData) {
       super(botData)

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
            headless: 'new',
            autoClose: 180000
        }).then((client) => {
            this.client = client
            this.start(client)
            this.onReady()
            this.onHandleMessages(client)
        }).catch((error) => {
            console.error(error)
        })
    }

    async start(client: Whatsapp) {
        await client.setProfileStatus(this.description)
    }

    async onReady() {
        console.log(`Bot ${this.number} | Online ✅`)
        const hostDevice: any = await this.client.getHostDevice()
        this.number = hostDevice.id.user
        new NotifyBotService().setNumber(this.id, this.number)

        this.status = BotStatus.EMERGENCY
        this.setBotStatus({ botId: this.id, status: BotStatus.EMERGENCY })
        this.sendMessageOfInitialization(this.client, this.name)
    }

    async disconnect(reason: string) {
        console.log('Client was logged out', reason)
        this.status = BotStatus.DESTROYED
        this.qrCode = ""
        this.setBotStatus({ botId: this.id, status: BotStatus.DESTROYED })
        this.destroy()
    }

    private async sendMessageOfInitialization(client: Whatsapp, botName: string) {
        this.superAdmins.forEach(async element => {
            await client.sendText(`${element}@c.us`, `*Bot ${botName.toUpperCase()} Initialized*`)
        })
    }

    async onHandleMessages(client: Whatsapp) {
        client.onMessage(async (message: Message) => {
            if (!this.config) return
    
            const isGroup: boolean = this.isGroupMessage(message)
    
            // Sending automatic messages
            if (!isGroup && this.config.automaticMessagePermission && this.config.automaticMessage) {
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
            message: message.body,
            createdAt: new Date().toISOString()
        }
    }

    private isGroupMessage(message: Message): boolean {
        return (message.from.search('@g') === -1) ? false : true
    }

    private async sendHandleMessageInfoToRabbitMQ(handleMessageInfo: HandleMessageInfo) {
        const notifyBotService: NotifyBotService = new NotifyBotService()
        await notifyBotService.sendHandleMessageInfoToRabbitMQ(this.config?.queueRabbitMqHandleMessage!!, handleMessageInfo)
    }

    private async setBotStatus(notifyBotStatus: NotifyBotStatus) {
        const notifyBotService: NotifyBotService = new NotifyBotService()
        await notifyBotService.setBotStatus(notifyBotStatus)

        if(this.config?.queueRabbitMqPermission) {
            this.notifyBotStatus(notifyBotStatus)
        }
    }

    private async notifyBotStatus(notifyBotStatus: NotifyBotStatus) {
        const notifyBotService: NotifyBotService = new NotifyBotService()
        await notifyBotService.notifyToRabbitMQ(this.config?.queueRabbitMqBotStatus!!, notifyBotStatus)
    }

    updateBotConfig(notifyBotConfig: NotifyBotConfig | null): void {
        this.config = notifyBotConfig
    }

    getBotConfig(): NotifyBotConfig | null {
        return this.config
    }

    async destroy(): Promise<void> {
        await this.client.close()
        await this.setBotStatus({ botId: this.id, status: BotStatus.DESTROYED })
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
        await this.setBotStatus({ botId: this.id, status: BotStatus.OFFLINE })
        console.log(`Bot ${this.name} | Offline ⚠️`)
    }

    async sendMessage(sendTo: string, message: string): Promise<void> {
        await this.client.sendText(`${sendTo}@c.us`, message)
    }

    // Send a message with image
    async sendMessageWithImage(sendTo: string, message: string, imageFilePath: string) {
        await this.client.sendImage(sendTo, imageFilePath, 'image-name.jpg', message)
    }

    // Send a message with image url
    async sendMessageWithImageUrl(sendTo: string, message: string, imageUrl: string) {
        await this.client.sendImage(sendTo, imageUrl, 'image-name.jpg', message)
    }

    createGroup(title: string, description: string, imgProfileUrl: string | null, adminsOfThisGroup: string[]): Promise<string> {
        throw new Error(Errors.ThisBotIsUnableToPerformThisAction)
    }

    returnGroupById(groupId: string): Promise<GroupChat> {
        throw new Error(Errors.ThisBotIsUnableToPerformThisAction)
    }

    addParticipantToGroup(groupId: string, phone: string): Promise<void> {
        throw new Error(Errors.ThisBotIsUnableToPerformThisAction)
    }

    removeParticipantFromTheGroup(groupId: string, phone: string): Promise<void> {
        throw new Error(Errors.ThisBotIsUnableToPerformThisAction)
    }

    deleteGroup(groupId: string): Promise<void> {
        throw new Error(Errors.ThisBotIsUnableToPerformThisAction)
    }

    sendMessageToTheGroup(groupId: string, message: string): Promise<void> {
        throw new Error(Errors.ThisBotIsUnableToPerformThisAction)
    }

    updatePhotoProfile(filePath: string): Promise<void> {
        throw new Error(Errors.ThisBotIsUnableToPerformThisAction)
    }

}
