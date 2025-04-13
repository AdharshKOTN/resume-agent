"use client";

import { useState, useRef, useEffect } from "react";

export default function Microphone() {

    const [isRecording, setIsRecording] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        const initMic = async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              streamRef.current = stream;
      
              const audioContext = new AudioContext();
              audioContextRef.current = audioContext;

              if (audioContext.state === "suspended") {
                await audioContext.resume();
              }
      
              const source = audioContext.createMediaStreamSource(stream);
              sourceRef.current = source;
      
              setIsRecording(true);
              console.log("Mic access granted");
            } catch (err) {
              console.error("Mic permission denied or error:", err);
            }
          };
      
          initMic();
    }, []);

    const toggleRecording = () => {
        setIsRecording(!isRecording);
    };

    return (
        <div className="flex flex-col gap-2 items-center justify-center">
            <button className="bg-black border-2 border-white hover:bg-gray-700 py-2 px-4 w-15 h-15 rounded-full" onClick={toggleRecording}>
                {isRecording ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true" fill="none" stroke="red" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18m-4.399-4.4A6 6 0 0 0 18 12.75v-1.5M9 9V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-.537 1.713M12 18.75a6 6 0 0 0 2.292-.455M12 18.75a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5m-4.02-6.762a3 3 0 0 1-2.718-2.718"></path>
                    </svg>
                )}
            </button>
        </div>
    );
}
