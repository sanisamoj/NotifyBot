import { ParticipantResponse } from "./ParticipantResponse";

export interface GroupInfoResponse {
    id: string,
    title: string,
    description: string,
    participants: ParticipantResponse[]
}