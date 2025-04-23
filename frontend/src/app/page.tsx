"use client";

import AgentRespDisplay from "@/components/agentRespDisplay";
import Microphone from "@/components/microphone";
import TranscriptDisplay from "@/components/transcriptDisplay";
import { useState } from "react";
import {AgentResponse} from "@/components/types"

export default function Home() {

  const [responses, setResponses] = useState<string[]>([]);

  const [transcripts, setTranscripts] = useState<string[]>([]);

  const onTranscipt = (transcript: string)  =>{
    if(transcript.trim()){
      setTranscripts((prevTranscripts) => [transcript, ...prevTranscripts]);
    }
  }

  const onAgentResponse = (response: AgentResponse) => {
    console.log("Agent response:", response);
    if(response.text.trim()){
      setResponses((prevResponses) => [response.text, ...prevResponses]);
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <AgentRespDisplay responses={responses} onAgentResponse={onAgentResponse}/>
        <Microphone onTranscript={onTranscipt}/>
        <TranscriptDisplay transcripts={transcripts}/>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">

      </footer>
    </div>
  );
}
