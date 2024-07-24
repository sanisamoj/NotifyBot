import { Client } from "whatsapp-web.js"

export class AdminService {
    constructor() { }

    #adminsInEnv = process.env.SUPER_USER as string
    #allAdmins: string[] = []

    private returnAllAdmins(): string[] {
        this.#allAdmins = this.#adminsInEnv.split(", ")
        return this.#allAdmins
    }

    async sendMessageOfInitialization(client: Client, botName: string) {

        const allAdmins = this.returnAllAdmins()

        for (const admin of allAdmins) {
            await client.sendMessage(`${admin}@c.us`, `*Bot ${botName.toUpperCase()} Initialized*`)
        }
    }
}