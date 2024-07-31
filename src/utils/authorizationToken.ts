import JwtModule from 'jsonwebtoken'

export function authorizationToken(id: string, username: string, secret: string): string {
    const JWT = JwtModule

    return JWT.sign(
        {
            id: id,
            username: username
        },
        secret,
        {
            subject: id,
            expiresIn: "30d",
        }
    )
}