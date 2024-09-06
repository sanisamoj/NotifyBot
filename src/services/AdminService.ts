import { Errors } from "../data/models/enums/Errors"
import { AdminLoginResponse } from "../data/models/interfaces/AdminLoginResponse"
import * as dotenv from 'dotenv'
import { authorizationToken } from "../utils/authorizationToken"

dotenv.config()

export class AdminService {
    async login(email: string, password: string): Promise<AdminLoginResponse> {
        this.adminCredentialsMatch(email, password)
        const secretKey: string = process.env.ADMIN_SECRET_KEY as string
        const token: string = authorizationToken("00@", "Moderator", secretKey, "1095d") // 3 days
        const adminLoginResponse: AdminLoginResponse = { token: token }
        return adminLoginResponse
    }

    private adminCredentialsMatch(email: string, password: string): void {
        const adminEmail: string = process.env.ADMIN_USENAME as string
        const adminPassword: string = process.env.ADMIN_PASSWORD as string
        if (email !== adminEmail || password !== adminPassword) {
            throw new Error(Errors.InvalidUsernameOrPassword)
        }
    }
}