type AgentResponse = {
    session_id: string;
    text: string;
    duration: number;
}

type AudioResponse = {
    session_id: string;
    audio: ArrayBuffer;
    duration: number;
    audioPath?: string;
}
export type { AgentResponse, AudioResponse};