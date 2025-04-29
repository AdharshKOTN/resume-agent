"use client";

import AgentRespDisplay from "@/components/agentRespDisplay";
import Microphone from "@/components/microphone";
import TranscriptDisplay from "@/components/transcriptDisplay";
import { useState } from "react";
import {AgentResponse} from "@/components/types"
import AudioVisual from "@/components/audioVisual";

export default function Home() {

  const [responses, setResponses] = useState<AgentResponse[]>([]);

  const [transcripts, setTranscripts] = useState<string[]>([]);

  const [tempAudio, setTempAudio] = useState<Blob | null>(null);

  const onTranscipt = (transcript: string)  =>{
    if(transcript.trim()){
      setTranscripts((prevTranscripts) => [transcript, ...prevTranscripts]);
    }
  }

  const onAudio = (audio: Blob) => {
    setTempAudio(audio);
  }

  const onAgentResponse = (response: AgentResponse) => {
    console.log("Agent response:", response);
    if(response.text.trim()){
      setResponses((prevResponses) => [response, ...prevResponses]);
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <AudioVisual audioResponse={{audio: tempAudio}}/>
        <AgentRespDisplay responses={responses} onAgentResponse={onAgentResponse}/>
        <Microphone onTranscript={onTranscipt} onAudio={onAudio}/>
        <TranscriptDisplay transcripts={transcripts}/>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">

      </footer>
    </div>
  );
}
