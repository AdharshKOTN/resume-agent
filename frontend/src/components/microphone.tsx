"use client";

import { useState, useRef, useEffect } from "react";

import { io, Socket } from "socket.io-client";

export default function Microphone() {

    const [isRecording, setIsRecording] = useState(false);


    // refs to store audio context, stream, and source ( get and manipulate audio stream from mic)
    // -----------------------------------------------------------------------------------------------
    const streamRef = useRef<MediaStream | null>(null); // getting mic stream from browser
    // const audioContextRef = useRef<AudioContext | null>(null); // to create audio context for visualiztion later on
    // const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null); // for analyzer node? 
    // ---------------------------------------------------------------------------------------------- 
    // ref to send/recieve audio data to/from backend
    const socketRef = useRef<Socket | null>(null);
    // ----------------------------------------------------------------------------------------------
    // ref to utilize microphone stream
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    // ----------------------------------------------------------------------------------------------
    useEffect(() => {
        const initMic = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                // const audioContext = new AudioContext();
                // audioContextRef.current = audioContext;

                // if (audioContext.state === "suspended") {
                //     await audioContext.resume();
                // }

                // const source = audioContext.createMediaStreamSource(stream);
                // sourceRef.current = source;

                setIsRecording(true);
                console.log("Mic access granted");
            } catch (err) {
                console.error("Mic permission denied or error:", err);
            }
        };

        initMic();
    }, []);

    useEffect(() => {
        const socket = io("http://localhost:5000");
        socketRef.current = socket;

        socket.on("connect", () => console.log("🔌 Socket connected"));
        socket.on("transcript", (data) => {
            console.log("🗣️ Received transcript:", data.text);
        });

        return () => {
            socket.disconnect();
            console.log("❌ Socket disconnected");
        };
    }, []);

    // when the user selects the microphone icon, create a new session id and start recording
    // chunk and send the audio to the backend
    // add each transcribed word to the word array
    const startRecording = () => {
        const stream = streamRef.current;
        if (!stream) return;

        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                sendAudioChunkToBackend(event.data);
            }
        };

        recorder.onstop = () => {
            console.log("Recording stopped.");
            mediaRecorderRef.current = null;
        };

        recorder.start(1000); // emit audio every 1 second
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
    };

    // free up the resources related to the session and recording
    const stopRecording = () => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
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

    const sendAudioChunkToBackend = async (audioBlob: Blob) => {
        if (!socketRef.current) return;

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();         // Convert Blob to binary
            const chunk = new Uint8Array(arrayBuffer);            // Wrap in Uint8Array

            socketRef.current.emit("audio_chunk", {
                session_id: sessionId,
                chunk: chunk,
            });

            console.log(`📤 Sent audio chunk — ${chunk.byteLength} bytes`);
        } catch (err) {
            console.error("❌ Failed to send audio chunk:", err);

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
