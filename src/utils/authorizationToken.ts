import JwtModule from 'jsonwebtoken'

export function authorizationToken(id: string, username: string, secret: string, expiresIn: string = "30d"): string {
    const JWT = JwtModule

    return JWT.sign(
        {
            id: id,
            username: username
        },
        secret,
        {
            subject: id,
            expiresIn: expiresIn,
        }
    )
}