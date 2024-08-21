import { BotCreateData } from '../../../data/models/interfaces/BotCreateData'
import { NotifyBotConfig } from '../../../data/models/interfaces/NotifyBotConfig'
import { GroupChat, MessageMedia } from 'whatsapp-web.js'
import { BotStatus } from '../enums/BotStatus'

export abstract class AbstractNotifyBot<T> {
    id: string
    name: string
    description: string
    number: string = ""
    profileImage: string | null = null
    qrCode: string | undefined = undefined
    protected config: NotifyBotConfig | null = null
    status: string

    protected client!: T
    protected superAdmins: string[]

    constructor(botData: BotCreateData) {
        this.id = botData.id
        this.name = botData.name
        this.description = botData.description
        this.profileImage = botData.profileImage
        this.superAdmins = botData.admins
        this.config = botData.config
        this.status = BotStatus.STARTED
    }

    protected abstract start(client: T): Promise<void>
    protected abstract onReady(): Promise<void>
    protected abstract disconnect(reason: string): Promise<void>
    protected abstract onHandleMessages(client: T): Promise<void>

    abstract updateBotConfig(notifyBotConfig: NotifyBotConfig | null): void
    abstract getBotConfig(): NotifyBotConfig | null
    abstract destroy(): Promise<void>
    abstract stop(): Promise<void>
    abstract sendMessage(sendTo: string, message: string): Promise<void>
    abstract sendMessageWithImage(sendTo: string, message: string, imageFilePath: string): Promise<void>
    abstract sendMessageWithImageUrl(sendTo: string, message: string, imageUrl: string): Promise<void>
    abstract createGroup(title: string, description: string, imgProfileUrl: string | null, adminsOfThisGroup: string[]): Promise<string>
    abstract returnGroupById(groupId: string): Promise<GroupChat>
    abstract addParticipantToGroup(groupId: string, phone: string): Promise<void>
    abstract removeParticipantFromTheGroup(groupId: string, phone: string): Promise<void>
    abstract deleteGroup(groupId: string): Promise<void>
    abstract sendMessageToTheGroup(groupId: string, message: string): Promise<void>
}
