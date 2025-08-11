"use client";

import { useState, useRef, useEffect } from "react";

import { Socket } from "socket.io-client";

import { v4 as uuidv4 } from "uuid";

import socket from "@/components/socket";
import { AudioResponse } from "./types";

interface MicrophoneProps {
  onTranscript: (transcript: string) => void;
  onAudioResponse: (audioResp: AudioResponse) => void;
}

export default function Microphone({onTranscript, onAudioResponse}: MicrophoneProps) {
  const [isRecording, setIsRecording] = useState(false);

  // refs to store audio context, stream, and source ( get and manipulate audio stream from mic)
  // -----------------------------------------------------------------------------------------------
  const streamRef = useRef<MediaStream | null>(null); // getting mic stream from browser
  // const audioContextRef = useRef<AudioContext | null>(null); // to create audio context for visualiztion later on
  // const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null); // for analyzer node?
  // ----------------------------------------------------------------------------------------------
  // ref to utilize microphone stream
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // ----------------------------------------------------------------------------------------------
  // ref to send/recieve audio data to/from backend
  const socketRef = useRef<Socket | null>(null);
  // ----------------------------------------------------------------------------------------------
  // Session information
  // const sessionId = useRef<string | null>(null);

  // store one long audio chunk to transcribe and pass to the agent
  const audioChunksRef = useRef<Blob []>([]);

  useEffect(() => {
    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        console.log("Mic access granted");
      } catch (err) {
        console.error("Mic permission denied or error:", err);
      }
    };

    initMic();
  }, []);


  useEffect(() => {
    socketRef.current = socket;

    socket.on("connect", () => console.log("🔌 Socket connected"));

    socket.on("transcript", (data) => {
        console.log("🗣️ Received transcript:", data.text);
        onTranscript(data.text);
    });

    socket.on("voice_response", (data: AudioResponse) => {
      console.log("🔊 Received audio data:", data); //should be of bytes
      console.log("Audio response:", data.audio.byteLength);
      data.audioPath = URL.createObjectURL(new Blob([data.audio], { type: "audio/wav" }));
      // const audio = new Audio(audioUrl);
      // audio.play();

      onAudioResponse(data);
      // setTempAudio(audioUrl);

    })

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.onAny((event, data) => {
      console.log("Socket event received:", event, data);
    });

    return () => {
      socket.disconnect();
    };
    
  }, [onTranscript, onAudioResponse]);

  const startRecording = () => {
    // validate stream is active
    if (!streamRef.current) {
      console.error("❌ No mic stream available.");
      return;
    }

    audioChunksRef.current = []; // reset the audio chunks array
    console.log("chunks array reset: " + audioChunksRef.current);

    // set new sessionID for each conversation
    const id = uuidv4();
    console.log("New session ID: " + id);
    console.log(`Setting session id: ${id} - ${id}`)

    // notify backend of new stream
    socketRef.current?.emit("start_stream", { session_id: id });
    console.log(`🎙️ Starting new session: ${id}`);

    const recorder = new MediaRecorder(streamRef.current!, {
      mimeType: "audio/webm;codecs=opus",
    });

    // promise data flow controller

    let resolveFinal: () => void;

    const finalChunkPromise = new Promise<void>((res) => {
      resolveFinal = res;
    });

    // recorder behavior set for when data appears and when the recording stops?
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // sendAudioChunkToBackend(event.data, id);
        audioChunksRef.current.push(event.data);
      }
      if (recorder.state === "inactive") {
        resolveFinal();
        console.log("Recording stopped, sending final chunk...");
      }
    };

    recorder.onstop = async () => {
      setIsRecording(false);
      console.log("🛑 Recording stopped.");

      await finalChunkPromise;

      const fullBlob = new Blob(audioChunksRef.current, {type: "audio/webm"});

      if (id) {
        const arrayBuffer = await fullBlob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        socketRef.current?.emit("end_stream", { session_id: id, blob: uint8 });
        console.log(`📤 Sent end_stream for session: ${id}`);
      }
      else{
        console.log(`Invalid Session: ${id}`)
      }
  
      // Playback test
      // const audioURL = URL.createObjectURL(fullBlob);
      // const audio = new Audio(audioURL);
      // // audio.play().then(() => {
      // //     console.log("✅ Audio playback started.");
      // // }).catch((err) => {
      // //     console.error("❌ Audio playback error:", err);
      // // });
  
      // // Optional: Save for manual inspection
      // const a = document.createElement("a");
      // a.href = audioURL;
      // a.download = "debug_recording.webm";
      // a.click();
      

      mediaRecorderRef.current = null;
    };

    // 1 second chunks of audio are emitted
    // recorder.start(1000); // emit audio every 1 second
    recorder.start(); // uninterrupted recording
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  // free up the resources related to the session and recording
  const stopRecording = async () => {
    if (
        mediaRecorderRef.current! &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop(); // should halt the recording and forward the blob array to the backend
        console.log("Stopping MediaRecorder");
    }
    
    setIsRecording(false);
    };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      <button
        className="bg-black border-2 border-white hover:bg-gray-700 py-2 px-4 w-15 h-15 rounded-full"
        onClick={toggleRecording}>
        {isRecording ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            aria-hidden="true"
            fill="none"
            stroke="red"
            className="size-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m3 3 18 18m-4.399-4.4A6 6 0 0 0 18 12.75v-1.5M9 9V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-.537 1.713M12 18.75a6 6 0 0 0 2.292-.455M12 18.75a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5m-4.02-6.762a3 3 0 0 1-2.718-2.718"></path>
          </svg>
        )}
      </button>
    </div>
  );
}
