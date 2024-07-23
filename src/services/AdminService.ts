import { Whatsapp } from 'venom-bot';

export class AdminService {
    private adminsInEnv: string;
    private allAdmins: string[] = [];

    constructor() {
        this.adminsInEnv = process.env.SUPER_USER as string;
    }

    // Retorna todos os admins em array do bot
    returnAllAdmins(): string[] {
        this.allAdmins = this.adminsInEnv.split(", ");
        return this.allAdmins;
    }

    // Envia mensagem de inicialização a todos os admins
    async sendMessageOfInitialization(client: Whatsapp, botName: string): Promise<void> {
        const allAdmins = this.returnAllAdmins();

        for (const admin of allAdmins) {
            // Envia mensagem ao superusuário de inicialização
            try {
                await client.sendText(`${admin}@c.us`, `*Bot ${botName.toUpperCase()} Initialized*`);
            } catch (error) {
                console.error(`Failed to send initialization message to ${admin}: ${error}`);
            }
        }
    }
}
