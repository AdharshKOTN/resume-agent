type AgentResponse = {
    session_id: string;
    text: string;
    duration: number;
}

type AudioResponse = {
    session_id: string;
    audio: Blob;
}
export type { AgentResponse, AudioResponse};