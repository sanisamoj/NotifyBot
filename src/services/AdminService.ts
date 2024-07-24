import { Whatsapp } from 'venom-bot';

export class AdminService {
    private adminsInEnv: string;
    private allAdmins: string[] = [];

    constructor() {
        this.adminsInEnv = process.env.SUPER_USER as string;
    }

    // Returns all admins in the bot array
    returnAllAdmins(): string[] {
        this.allAdmins = this.adminsInEnv.split(", ");
        return this.allAdmins;
    }

    // Send startup message to all admins
    async sendMessageOfInitialization(client: Whatsapp, botName: string): Promise<void> {
        const allAdmins = this.returnAllAdmins();

        for (const admin of allAdmins) {
            // Send message to startup superuser
            try {
                await client.sendText(`${admin}@c.us`, `*Bot ${botName.toUpperCase()} Initialized*`);
            } catch (error) {
                console.error(`Failed to send initialization message to ${admin}: ${error}`);
            }
        }
    }
}
