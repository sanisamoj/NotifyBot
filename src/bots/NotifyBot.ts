import * as fsExtra from 'fs-extra'
import * as path from 'path'
import { BotCreateData } from '../data/models/interfaces/BotCreateData'
import { Config } from '../Config'
import { Client, GroupChat, LocalAuth, Message, MessageMedia, WAState } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { Errors } from '../data/models/enums/Errors'
import { NotifyBotConfig } from '../data/models/interfaces/NotifyBotConfig'
import { NotifyBotService } from './NotifyBotService'

export class NotifyBot {
    id: string
    name: string;
    description: string
    number: string = ""
    profileImage: string | null = null
    qrCode: string | undefined = undefined
    config: NotifyBotConfig | null = null
    active: boolean = false

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
            console.log(`Bot ${this.number} | Online ✅`)
            this.number = this.client.info.wid.user
            this.sendMessageOfInitialization(this.client, this.name)
            this.active = true
        })

        this.client.initialize().then(async () => {
            this.start(this.client)
            this.onHandleMessages(this.client)
        })

        this.client.on('disconnected', (reason) => {
            console.log('Client was logged out', reason)
            this.active = false
        })

        this.client.on('change_state', (status: WAState) => {
            switch(status) {
                case WAState.CONFLICT:
                    this.active = false
                    break
                case WAState.CONNECTED:
                    this.active = true
                    break
                default:
                    break
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

    private async restart() {
        this.client.initialize().then(async () => {
            this.start(this.client)
            this.onHandleMessages(this.client)
        })
    }

    private async sendMessageOfInitialization(client: Client, botName: string) {
        this.superAdmins.forEach(async element => {
            await client.sendMessage(`${element}@c.us`, `*Bot ${botName.toUpperCase()} Initialized*`)
        })
    }

    private onHandleMessages(client: Client) {
        client.on('message', async (msg: Message) => {
            if (this.isAdmin(msg.from) || this.amI(msg.from)) {
                this.updateAutomaticMessageWithCommand(msg.body)
            }

            if (this.config) {
                if (this.config.automaticMessage != null && this.config.automaticMessagePermission) {
                    await client.sendMessage(msg.from, this.config.automaticMessage)
                }
            }
        })
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

    private updateAutomaticMessageWithCommand(command: string) {
        if (this.config) {
            if (command === "/start") {
                this.config.automaticMessagePermission = true
                new NotifyBotService().updateBotConfig(this.id, this.config)
            } else if (command === "/stop") {
                this.config.automaticMessagePermission = false
                new NotifyBotService().updateBotConfig(this.id, this.config)
            }
        }  
    }

    // Destroy the bot and deletes cache
    async destroy(): Promise<void> {
        await this.client.destroy()
        const pathSave = path.join(Config.SAVE_BOTS_FILE_PATH, `session-${this.id}`)

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
