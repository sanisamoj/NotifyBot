import { create, GroupCreation, Message, SocketState, Whatsapp } from 'venom-bot'
import * as fsExtra from 'fs-extra'
import * as path from 'path'
import { BotCreateData } from '../data/models/interfaces/BotCreateData'
import { AdminService } from '../services/AdminService'
import { Config } from '../Config'
import { SocketStream } from 'venom-bot/dist/api/model/enum'
import { HostDeviceInfo } from '../data/models/interfaces/HostDeviceInfo'

export class NotifyBot {
    id: string;
    name: string;
    description: string
    number: string = ""
    profileImage: string | null = null
    qrCode: string | undefined = undefined

    private client!: Whatsapp;
    private superAdmins: string[]

    constructor(botData: BotCreateData) {
        this.id = botData.id
        this.name = botData.name
        this.description = botData.description
        this.profileImage = botData.profileImage
        this.superAdmins = botData.admins

        create(
            this.id,
            (base64Qrimg, asciiQR, attempts, urlCode) => {
                console.log('urlCode (data-ref): ', urlCode)
                this.qrCode = urlCode
            },
            (statusSession, session) => {
                console.log('Status Session: ', statusSession)
                console.log('Session name: ', session)
            },
            {
                headless: 'new',
                logQR: true,
                autoClose: 60000,
                disableSpins: true,
                disableWelcome: true,
                updatesLog: false
            }
        )
        .then((client) => {
            this.client = client
            this.initialize(client)
            this.onHandleMessages(client)
        })
        .catch((error) => {
            console.error(`Error initializing bot: ${error}`)
        });
    }

    private async initialize(client: Whatsapp) {
        const hostDeviceInfo: HostDeviceInfo = await client.getHostDevice() as HostDeviceInfo
        this.number = hostDeviceInfo.id.user
        this.start()

        client.onStateChange((state: SocketState) => {
            console.log('State changed:', state)
        })

        client.onStreamChange((state: SocketStream) => {
            console.log('Stream state:', state)
        })
    }

    private onHandleMessages(client: Whatsapp) {
        client.onMessage((message: Message) => { 
            client.sendText(message.chatId, "Oi!")
        } )
    }

    // Configure the bot and send an initialization message
    private async start() {
        const adminService = new AdminService();
        adminService.sendMessageOfInitialization(this.client, this.name)

        await this.client.setProfileName(this.name)
        await this.client.setProfileStatus(this.description)

        if (this.profileImage) {
            await this.client.setProfilePic(this.profileImage)
        }
    }

    // Delete and destroy the bot
    async destroy(): Promise<void> {
        await this.client.close()
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

    async stop(): Promise<void> {
        await this.client.close()
    }

    // Send a message
    async sendMessage(sendTo: string, message: string): Promise<void> {
        console.log("Cai aqui")
        await this.client
        .sendText(`${sendTo}@c.us`, message)
        .then((result) => {
            console.log('Result: ', result); //return object success
          })
          .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
          });
    }

    // Create a group
    async createGroup(title: string, description: string, imgProfileUrl: string | null, adminsOfThisGroup: string[] = []): Promise<string> {
        const adminsSerialized: string[] = adminsOfThisGroup.map(phone => phone + "@c.us")
        const superAdminsSerialized: string[] = this.superAdmins.map(phone => phone + "@c.us")
        const admins: string[] = [...adminsSerialized, ...superAdminsSerialized]
        const group: GroupCreation = await this.client.createGroup(title, admins)
        console.log(group)

        await this.client.setGroupDescription(group.gid._serialized, description)
        await this.client.promoteParticipant(group.gid._serialized, admins)
        
        if (imgProfileUrl) {
            try {
                await this.client.setGroupImage(group.gid._serialized, imgProfileUrl)
            } catch (error) {
                console.error(error);
            }
        }

        return group.gid._serialized
    }

    // Returns the group by ID
    async returnGroupById(groupId: string): Promise<any> {
        return await this.client.getGroupAdmins(groupId); // Fazer
    }

    // Add a participant to the group
    async addParticipantToGroup(groupId: string, phone: string): Promise<void> {
        const group = await this.returnGroupById(groupId);
        const totalParticipants: number = group.participants.length;

        if (totalParticipants < 1003) {
            try {
                await this.client.addParticipant(groupId, `${phone}@c.us`)
            } catch (error) {
                throw new Error("User not added");
            }
        } else {
            throw new Error("Max participants reached");
        }
    }

    // Remove a participant from the group
    async removeParticipantFromGroup(groupId: string, phone: string): Promise<void> {
        try {
            await this.client.removeParticipant(groupId, `${phone}@c.us`)
        } catch (error) {
            throw new Error("User not removed")
        }
    }

    // Delete the group
    async deleteGroup(groupId: string): Promise<void> {
        const group = await this.returnGroupById(groupId);
        for (let participant of group.participants) {
            try {
                await this.client.removeParticipant(groupId, participant.id)
            } catch (error) {
                console.error(error)
            }
        }

        try {
            await this.client.leaveGroup(groupId)
        } catch (error) {
            throw new Error("Group not deleted")
        }
    }

    // Send a message to the group
    async sendMessageToGroup(groupId: string, message: string): Promise<void> {
        await this.client.sendText(groupId, message)
    }
}
