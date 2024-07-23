export interface IBot {
    id: string
    name: string
    urlImageProfile: string
    bio: string
    sendMessage(message: string, to: string): void
    createGroup(title: string, description: string, imgProfileUrl: string | null, superAdmins: string[]): Promise<string>
    returnGroupById(groupId: string): void
    addParticipantToGroup(groupId: string, phone: string): void
    removeParticipantToGroup(groupId: string, phone: string): void
    deleteGroup(groupId: string): void
    sendMessageToTheGroup(groupId: string, message: string): void
    destroy(): void
}