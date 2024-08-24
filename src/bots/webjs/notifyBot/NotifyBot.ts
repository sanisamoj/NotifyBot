import * as fsExtra from 'fs-extra'
import * as path from 'path'
import { BotCreateData } from '../../../data/models/interfaces/BotCreateData'
import { Config } from '../../../Config'
import { Call, Client, GroupChat, LocalAuth, Message, MessageMedia, WAState } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { Errors } from '../../../data/models/enums/Errors'
import { NotifyBotConfig } from '../../../data/models/interfaces/NotifyBotConfig'
import { HandleMessageInfo } from '../../../data/models/interfaces/HandleMessageInfo'
import { NotifyBotStatus } from '../../../data/models/interfaces/NotifyBotStatus'
import { NotifyBotService } from '../../services/NotifyBotService'
import { BotStatus } from '../../../data/models/enums/BotStatus'
import { AbstractNotifyBot } from '../../../data/models/abstracts/AbstractNotifyBot'

export class NotifyBot extends AbstractNotifyBot<Client> {

    constructor(botData: BotCreateData) {
        super(botData)

        this.client = new Client({
            puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
            authStrategy: new LocalAuth({
                clientId: this.id,
                dataPath: Config.SAVE_BOTS_FILE_PATH
            })
        })

        const timeout: number = 120000
        const timeoutId = setTimeout(async () => {
            console.log('O QR Code não foi escaneado a tempo. Fechando o navegador...')
            await this.destroy()
        }, timeout)

        this.client.on('qr', (qr: string) => {
            qrcode.generate(qr, { small: true })
            this.qrCode = qr
        })

        this.client.on('ready', () => {
            clearTimeout(timeoutId)
            this.onReady()
            this.start(this.client)
        })

        this.client.initialize().then(async () => {
            this.onHandleMessages(this.client)
        })

        this.client.on('disconnected', (reason) => {
            this.disconnect(reason)
        })

        this.client.on('change_state', (status: WAState) => {
            console.log(`Status: ${status}`)
            switch (status) {
                case WAState.CONFLICT:
                    this.status = BotStatus.CONFLICT
                    this.setNotifyBotStatus({ botId: this.id, status: BotStatus.CONFLICT })
                    break
                case WAState.CONNECTED:
                    this.status = BotStatus.ONLINE
                    this.setNotifyBotStatus({ botId: this.id, status: BotStatus.ONLINE })
                    break
                default:
                    break
            }
        })

        this.client.on('call', (call: Call) => {
            if (this.config && this.config.callPermission === false) {
                try {
                    call.reject()
                    this.client.sendMessage(call.from!!, this.config.automaticCallMessage!!)
                } catch (error: any) { }
            }
        })
    }

    // Configure the bot and send an initialization message
    async start(client: Client) {
        await client.setDisplayName(this.name)
        await client.setStatus(this.description)

        if (this.profileImage != null) {
            const media: MessageMedia = await MessageMedia.fromUrl(this.profileImage, { unsafeMime: true })
            await client.setProfilePicture(media)
        }
    }

    // Performs procedures when the bot is ready
    async onReady() {
        console.log(`Bot ${this.number} | Online ✅`)
        this.number = this.client.info.wid.user
        new NotifyBotService().setNumber(this.id, this.number)

        this.status = BotStatus.ONLINE
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.ONLINE })
        this.sendMessageOfInitialization(this.client, this.name)
    }

    // Performs the procedures for disconnection
    async disconnect(reason: string) {
        console.log('Client was logged out', reason)
        this.status = BotStatus.DESTROYED
        this.qrCode = ""
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.DESTROYED })
    }

    // Sends startup message to all admins
    private async sendMessageOfInitialization(client: Client, botName: string) {
        this.superAdmins.forEach(async element => {
            await client.sendMessage(`${element}@c.us`, `*Bot ${botName.toUpperCase()} Initialized*`)
        })
    }

    async onHandleMessages(client: Client) {
        client.on('message', async (message: Message) => {
            if (!this.config) return

            const isGroup: boolean = this.isGroupMessage(message)

            // Sending automatic messages
            if (!isGroup && this.config.automaticMessagePermission && this.config.automaticMessage) {
                await client.sendMessage(message.from, this.config.automaticMessage)
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

    // Destroy the bot and deletes cache
    async destroy(): Promise<void> {
        await this.client.destroy()
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.DESTROYED })
        const pathSave: string = path.join(Config.SAVE_BOTS_FILE_PATH, `session-${this.id}`)

        if (fsExtra.existsSync(pathSave)) {
            try {
                fsExtra.removeSync(pathSave)
            } catch (error) {
                console.error(`Erro ao apagar a pasta: ${error}`)
            }
        }

        console.log(`Bot ${this.name} | Offline ⚠️`)
    }

    // Destroy the bot
    async stop(): Promise<void> {
        await this.client.destroy()
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.OFFLINE })
    }

    // Send a message
    async sendMessage(sendTo: string, message: string): Promise<void> {
        await this.client.sendMessage(`${sendTo}@c.us`, message)
    }

    // Send a message with image
    async sendMessageWithImage(sendTo: string, message: string | null, imageFilePath: string) {
        const media: MessageMedia = MessageMedia.fromFilePath(imageFilePath)
        if (message) {
            await this.client.sendMessage(`${sendTo}@c.us`, media, { caption: message })
        } else {
            await this.client.sendMessage(`${sendTo}@c.us`, media)
        }
    }

    // Send a message with image url
    async sendMessageWithImageUrl(sendTo: string, message: string, imageUrl: string) {
        const media: MessageMedia = await MessageMedia.fromUrl(imageUrl)
        await this.client.sendMessage(sendTo, media, { caption: message })
    }

    // Create a group
    async createGroup(title: string, description: string, imgProfileUrl: string | null, adminsOfThisGroup: string[] = []): Promise<string> {
        const adminsSerialized: string[] = adminsOfThisGroup.map(phone => phone + "@c.us")
        const superAdminsSerialized: string[] = this.superAdmins.map(phone => phone + "@c.us")
        const admins: string[] = [...adminsSerialized, ...superAdminsSerialized]

        const group: any = await this.client.createGroup(title, admins)
        const groupChat = await this.client.getChatById(`${group.gid._serialized}`) as GroupChat

        await groupChat.setDescription(description)
        await groupChat.setInfoAdminsOnly(true)
        await groupChat.promoteParticipants(admins)

        if (imgProfileUrl != null) {
            new Promise(async () => {
                try {
                    const media: MessageMedia = await MessageMedia.fromUrl(imgProfileUrl, { unsafeMime: true })
                    await groupChat.setPicture(media)
                } catch (error) {
                    console.log(error)
                }
            })
        }

        await this.returnGroupById(group.gid.user)
        return group.gid.user
    }

    // Returns the group by ID
    async returnGroupById(groupId: string): Promise<GroupChat> {
        const group = await this.client.getChatById(`${groupId}@g.us`) as GroupChat
        return group
    }

    // Add a participant to the group
    async addParticipantToGroup(groupId: string, phone: string) {
        const group = await this.returnGroupById(groupId)
        const totalParticipants: number = group.participants.length

        if (totalParticipants < 1003) {
            try {
                await group.addParticipants(`${phone}@c.us`)
                return

            } catch (error) {
                throw new Error(Errors.UserNotAdded)

            }
        }

        throw new Error(Errors.MaxParticipantsReached)

    }

    // Remove a participant from the group
    async removeParticipantFromTheGroup(groupId: string, phone: string) {
        const group = await this.returnGroupById(groupId)
        try {
            if (this.number != phone) { await group.removeParticipants([`${phone}@c.us`]) }
        } catch (error) {
            throw new Error(Errors.UserNotRemoved)
        }
    }

    // Delete the group
    async deleteGroup(groupId: string) {
        const group = await this.returnGroupById(groupId)
        for (let participant of group.participants) {
            try {
                await group.removeParticipants([participant.id._serialized])
            } catch (error) {
                console.log(error)
            }
        }

        const groupDeleted: boolean = await group.delete()
        if (groupDeleted === false) { throw new Error(Errors.NoGroupsWereDeletes) }
        return
    }

    // Send a message to the group
    async sendMessageToTheGroup(groupId: string, message: string) {
        const group = await this.returnGroupById(groupId)
        await group.sendMessage(message)
    }
}
