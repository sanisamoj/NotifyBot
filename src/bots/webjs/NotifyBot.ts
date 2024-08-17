import * as fsExtra from 'fs-extra'
import * as path from 'path'
import { BotCreateData } from '../../data/models/interfaces/BotCreateData'
import { Config } from '../../Config'
import { Call, Client, GroupChat, LocalAuth, Message, MessageMedia, WAState } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { Errors } from '../../data/models/enums/Errors'
import { NotifyBotConfig } from '../../data/models/interfaces/NotifyBotConfig'
import { HandleMessageInfo } from '../../data/models/interfaces/HandleMessageInfo'
import { NotifyBotStatus } from '../../data/models/interfaces/NotifyBotStatus'
import { NotifyBotService } from './NotifyBotService'
import { BotStatus } from '../../data/models/enums/BotStatus'

export class NotifyBot {
    id: string
    name: string;
    description: string
    number: string = ""
    profileImage: string | null = null
    qrCode: string | undefined = undefined
    private config: NotifyBotConfig | null = null
    status: string = BotStatus.STARTED

    private client!: Client
    private superAdmins: string[]

    constructor(botData: BotCreateData) {
        this.id = botData.id
        this.name = botData.name
        this.description = botData.description
        this.profileImage = botData.profileImage
        this.superAdmins = botData.admins
        this.config = botData.config

        this.client = new Client({
            puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
            authStrategy: new LocalAuth({
                clientId: this.id,
                dataPath: Config.SAVE_BOTS_FILE_PATH
            })
        })

        this.client.on('qr', (qr: string) => {
            qrcode.generate(qr, { small: true })
            this.qrCode = qr
        })

        this.client.on('ready', () => {
            this.onReady()
        })

        this.client.initialize().then(async () => {
            this.start(this.client)
            this.onHandleMessages(this.client)
        })

        this.client.on('disconnected', (reason) => {
            this.disconnect(reason)
        })

        this.client.on('change_state', (status: WAState) => {
            switch (status) {
                case WAState.CONFLICT:
                    this.status = BotStatus.OFFLINE
                    this.setNotifyBotStatus({ botId: this.id, status: BotStatus.OFFLINE })
                    break
                case WAState.CONNECTED:
                    this.status = BotStatus.OFFLINE
                    this.setNotifyBotStatus({ botId: this.id, status: BotStatus.OFFLINE })
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
    private async start(client: Client) {
        await client.setDisplayName(this.name)
        await client.setStatus(this.description)

        if (this.profileImage != null) {
            const media: MessageMedia = await MessageMedia.fromUrl(this.profileImage, { unsafeMime: true })
            await client.setProfilePicture(media)
        }
    }

    // Performs procedures when the bot is ready
    private async onReady() {
        console.log(`Bot ${this.number} | Online ✅`)
        this.number = this.client.info.wid.user
        new NotifyBotService().setNumber(this.id, this.number)

        this.status = BotStatus.ONLINE
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.ONLINE })
        this.sendMessageOfInitialization(this.client, this.name)
    }

    // Performs the procedures for disconnection
    private async disconnect(reason: string) {
        console.log('Client was logged out', reason)
        this.status = BotStatus.DESTROYED
        this.qrCode = ""
        this.setNotifyBotStatus({ botId: this.id, status: BotStatus.DESTROYED })
        this.destroy()
    }

    // Sends startup message to all admins
    private async sendMessageOfInitialization(client: Client, botName: string) {
        this.superAdmins.forEach(async element => {
            await client.sendMessage(`${element}@c.us`, `*Bot ${botName.toUpperCase()} Initialized*`)
        })
    }

    private async onHandleMessages(client: Client) {
        client.on('message', async (message: Message) => {
            if (this.config) {
                // Automatic messages
                if (this.config.automaticMessage != null && this.config.automaticMessagePermission) {
                    await client.sendMessage(message.from, this.config.automaticMessage)
                }

                // Sent message to RabbitMQ
                if (this.config.queueRabbitMqHandleMessage) {
                    const from: string = message.from.replace("@c.us", "")
                    const handleMessageInfo: HandleMessageInfo = { botId: this.id, from: from, message: message.body }
                    await this.sendHandleMessageInfoToRabbitMQ(handleMessageInfo)
                }
            }
        })
    }

    private async sendHandleMessageInfoToRabbitMQ(handleMessageInfo: HandleMessageInfo) {
        const notifyBotService: NotifyBotService = new NotifyBotService()
        await notifyBotService.sendHandleMessageInfoToRabbitMQ(this.config?.queueRabbitMqHandleMessage!!, handleMessageInfo)
    }

    private async setNotifyBotStatus(notifyBotStatus: NotifyBotStatus) {
        const notifyBotService: NotifyBotService = new NotifyBotService()
        await notifyBotService.setStatusAndNotifyToRabbitMQ(this.config?.queueRabbitMqBotStatus!!, notifyBotStatus)
    }

    private isAdmin(messageFrom: string): boolean {
        const phone: string = messageFrom.replace("@c.us", "")
        if (this.superAdmins.includes(phone)) {
            return true
        } else { return false }
    }

    private amI(messageFrom: string): boolean {
        const phone: string = messageFrom.replace("@c.us", "")
        if (phone === this.number) {
            return true
        } else { return false }
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
