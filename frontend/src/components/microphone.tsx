"use client";

import { useState, useRef, useEffect } from "react";

import { v4 as uuidv4 } from "uuid";

interface MicrophoneProps {
  sessionId: string;
}

type Phase = "idle" | "listening" | "processing" | "responding";

export default function Microphone({ sessionId }: MicrophoneProps) {

  // stage 0: init states
  const [phase, setPhase] = useState<Phase>("idle");

  // stage 0a: init Audio Analyzer refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  //stage 1: microphone access
  const [userMicAccess, setUserMicAccess] = useState<boolean>(false);
  const [hasStream, setHasStream] = useState<boolean>(false);

  //stage 2: recording or cancelling
  const streamRef = useRef<MediaStream | null>(null); // getting mic stream from browser
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[] | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const requestId = useRef<string | null>(null);

  // stage 2a: speech detection
  const DECIBEL_ON_THRESHOLD = -38;   // cross up => user started speaking
  const DECIBEL_OFF_THRESHOLD = -48;   // drop below => user stopped speaking
  const QUIET_HOLD_MILLISECONDS = 1500; // duration that user stops speaking, consider question is ready
  const DECIBEL_SMOOTHING_ALPHA = 0.20; // 0..1 (lower = smoother)

  // High-frequency refs (no re-render spam)
  const isCurrentlySpeakingRef = useRef(false);
  const smoothedDecibelsRef = useRef(-100);
  const millisecondsQuietRef = useRef(0);
  const lastFrameTimestampRef = useRef<number | null>(null);

  // stage 2b: timer
  const CAP_MS = 60_000; // 60s
  const segStartRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  // const [duration, setDuration] = useState(0);


  //stage 4: submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const submittingRef = useRef<boolean>(false);

  //audio analyzer helper function
  const initAnalyser = async () => {
    if (!streamRef.current) return null;

    const audioContext = window.AudioContext;
    if (!audioCtxRef.current) audioCtxRef.current = new audioContext();
    //browser preferred audiocontext

    if (audioCtxRef.current!.state === "suspended") {
      await audioCtxRef.current!.resume();
    }// safari specific behavior

    // Recreate nodes and connect: stream → analyser (no output to speakers)
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();

    const src = audioCtxRef.current!.createMediaStreamSource(streamRef.current);
    // web audio source node, for pulling audio graph data from mic
    const analyser = audioCtxRef.current!.createAnalyser();
    // analyser node to determine active audio or silence

    analyser.fftSize = 2048;
    // standard analyser window?

    analyser.smoothingTimeConstant = 0.8;
    // low jitter

    src.connect(analyser);
    // mic source ( createMediaStreamSource ) tied to analyser

    sourceRef.current = src; // assign audio context mic source
    analyserRef.current = analyser; // assign analyser to reference
    return analyser;
  }

  // timer helper functions
  // Start ticking from *first speech*
  function startTimer() {
    console.log("Starting Timer...")
    if (segStartRef.current != null) return; // already running
    segStartRef.current = performance.now();

    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      const start = segStartRef.current;
      if (start == null) return; // stopped

      // const elapsed = performance.now() - start;
      // const clamped = Math.min(CAP_MS, elapsed);
      // setDuration(clamped);

    }, 200) as unknown as number;
  }

  // Stop ticking (use when submitting/cancelling)
  function stopTimer() {
    segStartRef.current = null;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }

  // Reset to zero (call after submit completes)
  function resetTimer() {
    stopTimer();
    // setDuration(0);
  }

  function stopRecorderIfActive() {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try { rec.stop(); } catch { }
    }
  }

  useEffect(() => {
    return () => {
      try { stopRecorderIfActive(); } catch { }
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      try { audioCtxRef.current?.close(); } catch { }
    };
  }, []);

  useEffect(() => { // access mic from user, set flag to allow recording, init streamRef
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

  useEffect(() => { // MediaRecorder feeds into audioChunks
    if (!hasStream || !streamRef.current) return;

    console.log("Starting Media Recording process.")
    const recorder = new MediaRecorder(streamRef.current!);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        if (!audioChunksRef.current) audioChunksRef.current = [];
        audioChunksRef.current!.push(event.data);
      }
    };
    mediaRecorderRef.current = recorder;
  }, [hasStream]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase !== "listening" || !analyserRef.current || !waveCanvasRef.current) return;

    console.log("Starting analysis");
    const analyser = analyserRef.current;
    analyser.fftSize = 2048;
    const buf = new Float32Array(analyser.fftSize);

    const canvas = waveCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width: cssW, height: cssH } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 1 unit = 1 CSS px
    };
    setupCanvas();
    const ro = new ResizeObserver(setupCanvas);
    ro.observe(canvas);

    let raf = 0;
    lastFrameTimestampRef.current = null;

    const draw = () => {
      raf = requestAnimationFrame(draw);

      analyser.getFloatTimeDomainData(buf);


      let energySum = 0;
      for (let i = 0; i < buf.length; i++) energySum += buf[i] * buf[i];
      const rootMeanSquare = Math.sqrt(energySum / buf.length);
      const currentDecibels = 20 * Math.log10(Math.max(rootMeanSquare, 1e-8));

      // --- Smooth dB to reduce flicker ---
      smoothedDecibelsRef.current =
        DECIBEL_SMOOTHING_ALPHA * currentDecibels +
        (1 - DECIBEL_SMOOTHING_ALPHA) * smoothedDecibelsRef.current;
      console.log("decibels: " + smoothedDecibelsRef.current);


      // --- Hysteresis decision (two thresholds) ---
      const wasSpeaking = isCurrentlySpeakingRef.current;
      const crossedIntoSpeaking =
        !wasSpeaking && smoothedDecibelsRef.current >= DECIBEL_ON_THRESHOLD;
      console.log("Crossed Into Speaking?: " + crossedIntoSpeaking)
      const crossedIntoSilence =
        wasSpeaking && smoothedDecibelsRef.current < DECIBEL_OFF_THRESHOLD;
      console.log("Crossed Into Silence?: " + crossedIntoSilence);


      if (crossedIntoSpeaking) {
        console.log("User is speaking");
        isCurrentlySpeakingRef.current = true;
        millisecondsQuietRef.current = 0;
        startTimer();
      } else if (crossedIntoSilence) {
        console.log("User stopped speaking. checking for how long...");
        isCurrentlySpeakingRef.current = false;
        millisecondsQuietRef.current = 0;
      }

      // --- Quiet-hold timing (end-of-utterance) ---
      const nowMs = performance.now();
      const rawDelta = lastFrameTimestampRef.current == null ? 0 : nowMs - lastFrameTimestampRef.current;
      const deltaMs = Math.min(rawDelta, 250);
      lastFrameTimestampRef.current = nowMs;

      if (!isCurrentlySpeakingRef.current) {
        millisecondsQuietRef.current += deltaMs;
        console.log("Elapsed time: " + millisecondsQuietRef.current);
        if (millisecondsQuietRef.current >= QUIET_HOLD_MILLISECONDS) {
          console.log("Exceeded quiet time");
          stopRecorderIfActive();
          triggerSubmitOnce();
        }
      } else {
        console.log("Resetting Quiet time, user must have continued speaking")
        millisecondsQuietRef.current = 0;
      }

      console.log("Checking time limit remaining on recording");
      const liveMs = segStartRef.current ? nowMs - segStartRef.current : 0;
      if (segStartRef.current && liveMs >= CAP_MS) {
        console.log("User has exceeded time limit");
        stopRecorderIfActive();
        triggerSubmitOnce();
      }

      const WIDTH = canvas.clientWidth;
      const HEIGHT = canvas.clientHeight;

      // background
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#111";
      ctx.beginPath();

      const step = WIDTH / buf.length;
      let x = 0;

      for (let i = 0; i < buf.length; i++) {
        const v = buf[i];
        const y = (0.5 - v / 2) * HEIGHT;

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += step;
      }

      ctx.lineTo(WIDTH, HEIGHT / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [phase, analyserRef]);


  const startRecording = async () => {
    if (!requestId.current) {
      requestId.current = uuidv4();
      console.log("New request ID: " + requestId.current);
      audioChunksRef.current = [];
    }
    else {
      return;
    }
    await initAnalyser();

    setPhase("listening");
    setIsRecording(true);
  };

  const recordingHandler = () => {
    if (!userMicAccess) return;
    if (phase === "idle") startRecording();
  };

  function triggerSubmitOnce() {
    console.log("Submitting to backend for processing");
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setPhase("processing");
    stopTimer();
    void handleSubmit().finally(() => {
      submittingRef.current = false;
    });
  }

  const handleSubmit = async () => {
    console.log("Attempting Submit");
    // TODO: need to configure re-attempt logic
    try {
      setIsSubmitting(true);

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

      audioChunksRef.current = [];
      requestId.current = null;

    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsRecording(false);
      resetTimer();
      setPhase("responding");
    }
  };


  return (
    <div className="flex items-center gap-3">
      {phase === "idle" && (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/5 px-3 py-2">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-sm text-black/90">Tap the mic to talk</span>
        </div>
      )}
      {/* Mic toggle */}
      <button
        type="button"
        onClick={recordingHandler}
        disabled={userMicAccess === false || isSubmitting}
        aria-pressed={isRecording}
        className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2
      ${isRecording ? "bg-gray-800 border-white" : "bg-black border-white hover:bg-gray-700"

          }
      ${userMicAccess === false || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isRecording ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="red" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18m-4.399-4.4A6 6 0 0 0 18 12.75v-1.5M9 9V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-.537 1.713M12 18.75a6 6 0 0 0 2.292-.455M12 18.75a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5m-4.02-6.762a3 3 0 0 1-2.718-2.718" />
          </svg>
        )}
      </button>
      <canvas
        className="rounded"
        ref={waveCanvasRef}
        style={{ width: "320px", height: "100px", display: "block" }}
      />
    </div>
  );
}
