"use client";

import AgentRespDisplay from "@/components/agentRespDisplay";
import Microphone from "@/components/microphone";
import TranscriptDisplay from "@/components/transcriptDisplay";
import { useCallback, useEffect, useRef, useState } from "react";
import {AgentResponse, AudioResponse} from "@/components/types"
import ServerStatus from "@/components/serverStatus";
import { Socket } from "socket.io-client";

import { v4 as uuidv4 } from "uuid";
import {getSocket, connectSocket} from "@/components/socket";

export default function Home() {

  const [responses, setResponses] = useState<AgentResponse[]>([]);

  const [transcripts, setTranscripts] = useState<string[]>([]);

  // const [tempAudioResp, setTempAudioResp] = useState<AudioResponse>();

  const [sessionId] = useState<string>(uuidv4());
  
  const socketRef = useRef<Socket | null>(getSocket());

  const onTranscript = useCallback((transcript: string)  =>{
    const clean_transcript = transcript.trim();
    if(clean_transcript){
      setTranscripts((prevTranscripts) => [clean_transcript, ...prevTranscripts]);
    }
  }, [])

  // const onAudioResponse = useCallback((audioResp: AudioResponse) => {
  //   // console.log("Audio response:", audioResp.audio);
  //   setTempAudioResp(audioResp);
  // }, []);

  const onAgentResponse = useCallback((response: AgentResponse) => {
    response.text = response.text.trim();
    if(response.text){
      setResponses((prevResponses) => [response, ...prevResponses]);
    }
  }, []);


  useEffect(() => { // establish socket connection
    const socket = connectSocket(sessionId); // ← pass sessionId here
    socketRef.current = socket;
    if(socketRef.current){
      const onConnect = () => console.log("connected", socketRef.current?.id, "for", sessionId);
      socketRef.current.on("connect", onConnect);
      return () => {
        socketRef.current?.off("connect", onConnect);
      } // remove listeners only
    }
    else{
      console.log("Socket connection not established")
    }
  }, [sessionId]); // when session id reset, reconnect socket with new session id


  useEffect(() => { // recieve socket communication

    const socket = socketRef.current;

    if(socket){

      socket.on("connect", () => console.log("🔌 Socket connected"));

      socket.on("transcript", (data) => {
          console.log("Received transcript:", data.text);
          onTranscript(data.text);
      });

      socket.on("agent_response", (data) => {
        console.log("Received response: " + data.text);
        onAgentResponse(data);
      })

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socket.onAny((event, data) => {
        console.log("Socket event received:", event, data);
      });

      // socket.on("voice_response", (data: AudioResponse) => {
      //   console.log("🔊 Received audio data:", data); //should be of bytes
      //   console.log("Audio response:", data.audio.byteLength);
      //   data.audioPath = URL.createObjectURL(new Blob([data.audio], { type: "audio/wav" }));
      //   // const audio = new Audio(audioUrl);
      //   // audio.play();

      //   onAudioResponse(data);
      //   // setTempAudio(audioUrl);
      // })
      return () => {
        socket.disconnect();
      };
    }
    else{
      console.log("Socket not established")
    }
    
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <ServerStatus />
        <AgentRespDisplay responses={responses}/>
        <Microphone sessionId={sessionId}/>
        <TranscriptDisplay transcripts={transcripts}/>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">

      </footer>
    </div>
  );
}
