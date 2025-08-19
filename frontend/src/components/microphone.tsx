"use client";

import { useState, useRef, useEffect } from "react";

import { v4 as uuidv4 } from "uuid";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface MicrophoneProps {
  sessionId: string;
}

export default function Microphone({ sessionId }: MicrophoneProps) {

  //stage 1: microphone access
  const [userMicAccess, setUserMicAccess] = useState<boolean>(false);
  const [hasStream, setHasStream] = useState<boolean>(false);

  //stage 2: recording or cancelling
  const streamRef = useRef<MediaStream | null>(null); // getting mic stream from browser
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[] | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const requestId = useRef<string | null>(null);

  // stage 2a: timer
  const [duration, setDuration] = useState<number>(0);
  const [segmentStart, setSegmentStart] = useState<number>(0)
  const CAP_MS = 60_000;
  const accMsRef = useRef(0);
  const segStartRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  // stage 3: pause and preview
  const [audioURL, setAudioURL] = useState<string | null>(null);

  //stage 4: submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // timer helper functions
  function startTimer() {
    segStartRef.current = performance.now();
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      if (segStartRef.current == null) return;
      const live = performance.now() - segStartRef.current;
      const total = Math.min(CAP_MS, accMsRef.current + live);
      setDuration(total);                 // you already have `duration` state
    }, 200) as unknown as number;
  }

  function pauseTimer() {
    if (segStartRef.current != null) {
      accMsRef.current += performance.now() - segStartRef.current;
      segStartRef.current = null;
    }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }

  function resetTimer() {
    pauseTimer();
    accMsRef.current = 0;
    setDuration(0);
  }

  useEffect(() => { // access mic from user, set flag to allow recording
    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1,
          },
        });
        streamRef.current = stream;
        setUserMicAccess(true);
        setHasStream(true);
        console.log("Mic access granted");
      } catch (err) {
        console.info("Mic permission denied or error:", err);
        setUserMicAccess(false);
        setHasStream(false);
      }
    };

    initMic();
  }, []);

  useEffect(() => {
  if (duration >= CAP_MS && mediaRecorderRef.current?.state === "recording") {
    try { mediaRecorderRef.current.stop(); } catch {}
    pauseTimer(); // ensures timer stops even if stop throws
  }
}, [duration]);

  useEffect(() => {
    if (!hasStream || !streamRef.current) return;
    const recorder = new MediaRecorder(streamRef.current!);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current!.push(event.data);
      }
    };
    mediaRecorderRef.current = recorder;
  }, [hasStream]);


  const startRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "inactive") return;
    if (requestId.current === null) {
      requestId.current = uuidv4();
      // setSegmentStart(performance.now())
      console.log("New request ID: " + requestId.current);
      audioChunksRef.current = [];
    }
    else {
      console.log("Appending to existing request" + + requestId.current);
    }
    recorder.start(1000);
    startTimer();
    setIsRecording(true);
  };

  useEffect(() => {

  }, [isRecording])

  const pauseRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    const onFlush = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) audioChunksRef.current!.push(e.data);
      recorder.removeEventListener("dataavailable", onFlush);
      recorder.pause();                    // pause only after the flush landed
      // (optional) build preview URL from audioChunksRef here
    };

    recorder.addEventListener("dataavailable", onFlush, { once: true });
    recorder.requestData(); 

    const blob = new Blob(audioChunksRef.current!, { type: recorder.mimeType || "" });
    // recorder.pause();
    pauseTimer();

    setAudioURL(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    })
  };

  const toggleRecording = () => {
    if (!userMicAccess) return;
    if (isRecording) {
      setIsRecording(false);
      pauseRecording();
    } else {
      setIsRecording(true);
      startRecording();
    }
  };

  const onCancel = () => {
    const recorder = mediaRecorderRef.current!;
    if (
      recorder! &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    }

    setIsRecording(false);
    setAudioURL(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    })
    audioChunksRef.current = [];
    requestId.current = null;
  };

  const handleSubmit = async () => {
    try {
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        await new Promise<void>(res => {
          rec.addEventListener("stop", () => res(), { once: true });
          rec.stop();
        });
      }

      const blob = new Blob(audioChunksRef.current!);
      const form = new FormData();
      form.append("file", blob, `rec-${Date.now()}.webm`);
      form.append("session_id", sessionId);
      form.append("request_id", requestId.current!);

      const resp = await fetch("/api/recordings", { method: "POST", body: form });
      if (!resp.ok) throw new Error(`upload failed: ${resp.status}`);

      setAudioURL(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
      audioChunksRef.current = [];
      requestId.current = null;

    } catch (err) {
      console.error(err);
      // keep chunks/requestId so user can retry
    } finally {
      setIsSubmitting(false);
      setIsRecording(false);
    }
  };


  return (
    // inside your Microphone component JSX
    <div className="flex items-center gap-3">
      {/* Mic toggle */}
      <button
        type="button"
        onClick={toggleRecording}
        disabled={userMicAccess === false || isSubmitting}
        aria-pressed={isRecording}
        className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2
      ${isRecording ? "bg-gray-800 border-white" : "bg-black border-white hover:bg-gray-700"

          }
      ${userMicAccess === false || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {/* your same mic svgs */}
        {isRecording ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="red" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18m-4.399-4.4A6 6 0 0 0 18 12.75v-1.5M9 9V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-.537 1.713M12 18.75a6 6 0 0 0 2.292-.455M12 18.75a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5m-4.02-6.762a3 3 0 0 1-2.718-2.718" />
          </svg>
        )}
        <span className="text-white text-sm font-medium">
          {isRecording ? "Recording" : "Record"}
        </span>
      </button>

        <AnimatePresence initial={false}>
      {(!isRecording && audioURL) && (
        <div className="flex items-center gap-2">
          <audio
            key={audioURL}
            controls
            preload="metadata"
            className="h-10 w-64 rounded bg-black"
            src={audioURL}
          />

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Cancel recording"
            className={`inline-flex items-center justify-center rounded border px-3 py-2 bg-black text-white
                        ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
          >
            ×
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`inline-flex items-center rounded border px-3 py-2 bg-black text-white
                        ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
          >
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </div>)}
        </AnimatePresence>
    </div>

  );
}
