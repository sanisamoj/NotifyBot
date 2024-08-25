import { Client, LocalAuth, WAState, Call, MessageMedia, Message, Chat, GroupChat, GroupParticipant, GroupNotification, GroupNotificationTypes, Contact } from "whatsapp-web.js"
import { Config } from "../../../Config"
import qrcode from 'qrcode-terminal'
import { BotStatus } from "../../../data/models/enums/BotStatus"
import { BotCreateData } from "../../../data/models/interfaces/BotCreateData"
import { NotifyBotService } from "../../services/NotifyBotService"
import { NotifyBotStatus } from "../../../data/models/interfaces/NotifyBotStatus"
import path from 'path'
import * as fsExtra from 'fs-extra'
import { PromoterBotApiService } from "./services/PromoterBotApiService"
import { PromoterGroup } from "./data/interfaces/MeduzaGroup"
import { PromoterBotConfig } from "./data/interfaces/PromoterBotConfig"
import { UserInGroup } from "./data/interfaces/UserInGroup"
import { MessageHistory } from "./data/interfaces/MessageHistory"

export class PromoterBot {
    id: string
    name: string
    description: string
    number: string = ""
    profileImage: string | null = null
    qrCode: string | undefined = undefined
    private config: PromoterBotConfig | null = null
    status: string = BotStatus.STARTED

    private client!: Client
    private superAdmins: string[]
    private promoterGroups: PromoterGroup[] = []
    private usersInGroup: UserInGroup[] = []

    constructor(botData: BotCreateData) {
        this.id = botData.id
        this.name = botData.name
        this.description = botData.description
        this.profileImage = botData.profileImage
        this.superAdmins = botData.admins
        this.config = botData.config as PromoterBotConfig

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
            this.setupEventHandlers(this.client)
        })

        this.client.on('disconnected', (reason) => {
            this.disconnect(reason)
        })

        this.client.on('change_state', (status: WAState) => {
            console.log(`Status: ${status}`)
            switch (status) {
                case WAState.CONFLICT:
                    this.status = BotStatus.CONFLICT
                    this.setBotStatus({ botId: this.id, status: BotStatus.CONFLICT })
                    break
                case WAState.CONNECTED:
                    this.status = BotStatus.ONLINE
                    this.setBotStatus({ botId: this.id, status: BotStatus.ONLINE })
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
        this.setBotStatus({ botId: this.id, status: BotStatus.ONLINE })
        this.sendMessageOfInitialization(this.client, this.name)
    }

    // Performs the procedures for disconnection
    private async disconnect(reason: string) {
        console.log('Client was logged out', reason)
        this.status = BotStatus.DESTROYED
        this.qrCode = ""
        this.setBotStatus({ botId: this.id, status: BotStatus.DESTROYED })
    }

    // Sends startup message to all admins
    private async sendMessageOfInitialization(client: Client, botName: string) {
        this.superAdmins.forEach(async element => {
            await client.sendMessage(`${element}@c.us`, `*Bot ${botName.toUpperCase()} Initialized*`)
        })
    }

    // Handles messages sent to the bot
    private async onHandleMessages(client: Client) {
        client.on('message', async (message: Message) => {
            const isGroup: boolean = this.isGroupMessage(message)
            const phone: string = message.from.replace('@c.us', '')
            const isAdminMessage: boolean = this.superAdmins.includes(phone)

            if (isGroup) {
                const chat: GroupChat = await message.getChat() as GroupChat
                const participants: GroupParticipant[] = chat.participants
                const groupInMemory: PromoterGroup = this.getGroupInfoInMemory(chat.id.user)
                const messageFromAdmin: boolean = this.isAdminFromThe(participants, message.author!!)
                const normalizedText: string = this.normalizedMessage(message.body)
                this.verifyUser(phone)

                if (this.config?.flooding) {
                    this.addMessageToTheMessageHistory(phone, message.body)
                    const isFlooding: boolean = this.isFlooding(phone)

                    if(isFlooding) {
                        if(this.config.messageFlooding) { await chat.sendMessage(this.config.messageFlooding) }
                        await chat.removeParticipants([message.from])
                        this.removeUserFromGroup(phone)
                    }
                }

                if(this.config?.blockZap) {
                    if(message.body.length > 1000) {
                        const messageToDelete: Message = await client.getMessageById(message.id._serialized)
                        await messageToDelete.delete(true)
                    }
                }

                switch (true) {
                    case normalizedText == '/boasvindas':
                        if (this.config?.welcomeMessage) {
                            await chat.sendMessage(this.config.welcomeMessage)
                        }
                        break
                    case normalizedText.slice(0, 6) == '/todos' && messageFromAdmin === true:
                        let text: string = ''
                        let mentions: string[] = []

                        for (let participant of participants) {
                            const contact: any = await this.client.getContactById(participant.id._serialized)

                            mentions.push(contact)
                            text += `@${participant.id.user}`
                        }
                        await this.client.sendMessage(message.from, '*Todos os membros foram marcados!!*', { mentions: mentions })
                        break
                    case normalizedText.slice(0, 8) == '/sorteio' && messageFromAdmin === true:
                        const participantsCount: number = participants.length
                        let randomNumber: number = Math.floor(Math.random() * participantsCount)
                        let contact: GroupParticipant = participants[randomNumber]

                        while (contact.id.user === this.number) {
                            randomNumber = Math.floor(Math.random() * participantsCount)
                            contact = participants[randomNumber]
                        }

                        await chat.sendMessage('Estou sorteando...')
                        setTimeout(async () => {
                            await chat.sendMessage(`Não teve para onde correr, foi você @${contact.id.user}`, { mentions: [contact.id._serialized] })
                        }, 1500)
                        break
                    case normalizedText.slice(0, 4) == '/cep':
                        const searchCep: string = message.body.slice(4).replaceAll(" ", "")
                        if (searchCep == '' || searchCep.includes('-')) {
                            await message.reply("Percebi algo diferente, tenta assim: */Cep 04163050*")
                        } else {
                            const cep: string = await new PromoterBotApiService().cep(searchCep)
                            await message.reply(cep)
                        }
                        break
                    case normalizedText.slice(0, 7) == '/climas':
                        const climate: string = await new PromoterBotApiService().everyDayWeather(normalizedText)
                        await message.reply(climate)
                        break
                    case normalizedText.search('clima') != -1 && normalizedText.search('/') == -1:
                        const simpleClimate: string = await new PromoterBotApiService().apiWeather()
                        await message.reply(simpleClimate)
                        break
                    case normalizedText.slice(0, 9) == '/noticias':
                        try {
                            const news: any = await new PromoterBotApiService().apiNews(message.body.slice(10))
                            if (news.linkImg == null) {
                                await chat.sendMessage(news.txt)
                            } else {
                                const media: MessageMedia = await MessageMedia.fromUrl(news.linkImg)
                                chat.sendMessage(media, { caption: news.txt })
                            }
                        } catch (error) {
                            await message.reply("*_Desculpe, os servidores das fontes estão meio lentos, tente novamente._*")
                        }
                        break
                    case normalizedText.search(this.name.toLowerCase()) != -1 && normalizedText.search('/') == 1:
                        const possibleMessages: string[] = [
                            'Qualquer coisa só digitar */comandos*',
                            'Oi?', 'oq?',
                            'Posso te ajudar? Só digitar */comandos*',
                            'Fala ai', 'digita *_/comandos_* ai pow'
                        ]
                        const selectedMessage: string = possibleMessages[Math.floor(Math.random() * possibleMessages.length)]
                        await message.reply(selectedMessage)
                        break
                    case normalizedText.search(this.name.toLowerCase()) != -1 && normalizedText.search('/') != 1:
                        const possibleMessages_2: string[] = [
                            'Qualquer coisa só digitar */comandos*',
                            'Posso te ajudar? Só digitar */comandos*',
                            'Eu ajudo mais digitando */comandos*', 'digita *_/comandos_* ai pow'
                        ]
                        const selectedMessage_2: string = possibleMessages_2[Math.floor(Math.random() * possibleMessages_2.length)]
                        await message.reply(selectedMessage_2)
                        break
                    case normalizedText.slice(0, 8) == '/sticker' && messageFromAdmin == true:
                        const valuePossible: number = parseInt(message.body.slice(9).replaceAll(' ', '')) || 6
                        this.setPossibleMessageSticker(chat.id.user, valuePossible)
                        await message.reply('*Valor alterado! 😊*')
                        break
                    case normalizedText.slice(0, 8) == '/message' && messageFromAdmin == true:
                        const value_possible: number = parseInt(message.body.slice(9).replaceAll(' ', '')) || 6
                        this.setPossibleMessage(chat.id.user, value_possible)
                        await message.reply('*Valor alterado! 😊*')
                        break
                    case normalizedText.slice(0, 5) == '/chat' && messageFromAdmin == true:
                        const valueChat: boolean = message.body.slice(6).replaceAll(" ", "") === "on"
                        this.setPossibleChat(chat.id.user, valueChat)
                        await message.reply('*Valor alterado! 😊*')
                        break
                    case normalizedText.slice(0, 6) == '/group' && messageFromAdmin == true:
                        await message.reply(`*GroupId* : ${groupInMemory.groupId}\n*Valor de possibilidades:*\n\n*Sticker* - ${groupInMemory.possibleMessagesticker}\n*Message* - ${groupInMemory.possibleMessage}\n*Chat* - ${groupInMemory.chat}`)
                        break
                    case normalizedText == '/comandos':
                        const comands: string = `*_Meus comandos por enquanto são:_*\n\n` +
                            `*/${this.name}* - _Aqui você me chama_\n` +
                            `*/Comandos* - _Aqui eu te mostro meus Comandos_\n` +
                            `*/Todos* - _Aqui eu marco todos os usuários do Grupo_\n` +
                            `*/Boasvindas* - _Aqui eu me apresento para o Grupo_ :)\n` +
                            `*/Sorteio* - _Aqui eu sorteio ou escolho aleatoriamente algum usuário do grupo e marco ele_\n` +
                            `*/Noticias* - _Aqui eu mostro uma noticia simples para você_ ex: */Notícias Política*\n` +
                            `*/Cep* - _Aqui eu te retorno o cep pesquisado_ ex: */cep 04163050*\n` +
                            `*/Climas* - _Retorno o clima dos próximos 6 dias_\n` +
                            `*/message* - _Aqui é controlado a frequência de respostas (Apenas admin)_\n` +
                            `*/sticker* - _Aqui é controlado a frequência de respostas com stickers (Apenas admin)_\n` +
                            `*/chat* - _Aqui é controlado a permissão de envio de respostas (Apenas admin)_`
                        await message.reply(comands)
                        break
                    default:
                        break
                }

                const possibleToSendSticker: number = Math.floor(Math.random() * groupInMemory.possibleMessagesticker)
                const possibleToSendMessage: number = Math.floor(Math.random() * groupInMemory.possibleMessage)

                if (possibleToSendSticker === 0 && message.body.search('/') === -1 && groupInMemory.chat) {
                    const sticker: MessageMedia = MessageMedia.fromFilePath(path.join(__dirname, '/stickers' + `/${await new PromoterBotApiService().sendSticker()}`))
                    await chat.sendMessage(sticker, { sendMediaAsSticker: true })
                }

                if (possibleToSendMessage === 0 && !message.body.includes('/') && groupInMemory.chat) {
                    const meduzaRepo = new PromoterBotApiService()

                    const answer = message.hasMedia
                        ? meduzaRepo.contextText('MIDIA')
                        : meduzaRepo.contextText(normalizedText)

                    if (answer) { await chat.sendMessage(answer) }
                }

            } else {
                if (this.config && !isAdminMessage) {

                    // Sending automatic messages
                    if (this.config.automaticMessagePermission && this.config.automaticMessage) {
                        await client.sendMessage(message.from, this.config.automaticMessage)
                    }
                }
            }
        })
    }

    private contextText(mensagemAnormalized: string): string | null {
        const normalizedMessage = mensagemAnormalized.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase()

        const messageMap: Map<string, string[]> = this.config?.responseTextContext ?? new Map<string, string[]>()

        for (const [key, messages] of messageMap) {
            if (normalizedMessage.includes(key)) {
                return messages[Math.floor(Math.random() * messages.length)]
            }
        }

        return null
    }

    // Checks if the user exists if not added
    private verifyUser(phone: string) {
        const userInGroup: UserInGroup | undefined = this.usersInGroup.find(element => element.phone === phone)
        if (userInGroup) { return }

        const user: UserInGroup = {
            phone: phone,
            messageHistoryList: []
        }

        this.usersInGroup.push(user)
    }

    // Removes the user from the user history array
    private removeUserFromGroup(phone: string) {
        const index: number = this.usersInGroup.findIndex(element => element.phone === phone)
        if(index !== 1) {
            this.usersInGroup.slice(index, 1)
        }
    }

    // Adds the message to the user's history
    private addMessageToTheMessageHistory(phone: string, message: string) {
        const userInGroup: UserInGroup | undefined = this.usersInGroup.find(element => element.phone === phone)
        const messageHistory: MessageHistory = { message: message, createdAt: new Date().getTime() }
        userInGroup?.messageHistoryList.push(messageHistory)
    }

    // Checks if the user is flooding
    private isFlooding(phone: string) {
        const userInGroup: UserInGroup | undefined = this.usersInGroup.find(element => element.phone === phone)
        if (!userInGroup || userInGroup.messageHistoryList.length === 1) { return false }

        if (userInGroup.messageHistoryList.length > 5) {
            userInGroup.messageHistoryList.shift()
            const areMessageEqual: boolean = userInGroup.messageHistoryList.every((messageHistory) => {
                return messageHistory.message === userInGroup.messageHistoryList[0].message
            })
            if (areMessageEqual) { return true }
        }

        const oldMessageTimestamp: number = userInGroup.messageHistoryList[0].createdAt
        const lastMessageTimestamp: number = userInGroup.messageHistoryList[userInGroup.messageHistoryList.length - 1].createdAt
        const timeDifference: number = lastMessageTimestamp - oldMessageTimestamp
        const messagePerSecond: number = userInGroup.messageHistoryList.length / (timeDifference / 1000)
        const messageLimitPerSecond: number = 3

        if (messagePerSecond > messageLimitPerSecond) {
            userInGroup.messageHistoryList.shift()
            return true
        }

        return false
    }

    // Observe the events
    private async setupEventHandlers(client: Client) {

        client.on('group_join', async (notification: GroupNotification) => {
            const { chatId, author, type } = notification
            const chat: Chat = await client.getChatById(chatId)

            if (this.config?.welcomeMessage) {

                let participantToMention: string | null = null

                if (type === GroupNotificationTypes.INVITE) {
                    participantToMention = (notification as any).id?.participant || null
                } else {
                    participantToMention = author
                }

                if (participantToMention) {
                    const contact: any = await client.getContactById(participantToMention);
                    await chat.sendMessage(`${this.config.welcomeMessage}`, { mentions: [contact] })
                }
            }
        })

        client.on('group_leave', async (notification: GroupNotification) => {
            if (this.config?.leaveMessage) {
                const { chatId } = notification
                const chat: Chat = await client.getChatById(chatId)
                await chat.sendMessage(this.config.leaveMessage)
            }
        })

    }

    // Checks if the message was sent from a group  
    private isGroupMessage(message: Message): boolean {
        return (message.from.search('@g') === -1) ? false : true
    }

    // Notifies about bot status
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

    // Returns the group by ID
    async returnGroupById(groupId: string): Promise<GroupChat> {
        const group = await this.client.getChatById(`${groupId}@g.us`) as GroupChat
        return group
    }

    // Adds the group to an in-memory array if it does not exist and returns
    private getGroupInfoInMemory(groupId: string): PromoterGroup {
        const founded: PromoterGroup | undefined = this.promoterGroups.find((element: PromoterGroup) => {
            return element.groupId === groupId
        })

        if (founded === undefined) {
            const newGroup: PromoterGroup = { botId: this.id, groupId: groupId, possibleMessagesticker: 6, possibleMessage: 6, chat: false }
            this.promoterGroups.push(newGroup)
            return newGroup
        }

        return founded
    }

    // Returns if the user is an admin of the group
    private isAdminFromThe(participants: GroupParticipant[], participant_serialized: string): boolean {
        const arrayAdmin: GroupParticipant[] = participants.filter((participant: GroupParticipant) => participant.isAdmin === true)
        const isAdmin: boolean = arrayAdmin.some((participantAdmin: GroupParticipant) => participantAdmin.id._serialized === participant_serialized)
        return isAdmin
    }

    // Format text to lowercase removes accents and spaces
    private normalizedMessage(messageBody: string): string {
        const normalizedMessage: string = messageBody.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replaceAll(" ", "")
        return normalizedMessage
    }

    // Change the value of the group's possible sticker
    private setPossibleMessageSticker(chatId: string, value: number = 6): void {
        const index: number = this.promoterGroups.findIndex(element => element.groupId === chatId)
        this.promoterGroups[index].possibleMessagesticker = value
        return
    }

    // Change the group's possible message value
    private setPossibleMessage(chatId: string, value: number = 6): void {
        const index: number = this.promoterGroups.findIndex(element => element.groupId === chatId)
        this.promoterGroups[index].possibleMessage = value
        return
    }

    // Change group chat value
    private setPossibleChat(chatId: string, value: boolean = false): void {
        const index: number = this.promoterGroups.findIndex(element => element.groupId === chatId)
        this.promoterGroups[index].chat = value
        return
    }

    // Destroy the bot and deletes cache
    async destroy(): Promise<void> {
        await this.client.destroy()
        await this.setBotStatus({ botId: this.id, status: BotStatus.DESTROYED })
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
        await this.setBotStatus({ botId: this.id, status: BotStatus.OFFLINE })
        console.log(`Bot ${this.name} | Offline ⚠️`)
    }

    // Updates bot config
    updateConfig(config: PromoterBotConfig | null): void {
        this.config = config
    }

    // Get bot config
    getConfig(): PromoterBotConfig | null {
        return this.config
    }
 
}