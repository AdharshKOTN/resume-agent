"use client";

import { useCallback, useEffect, useState } from "react";

import InfoPanel from "@/components/infoPanel";
import AgentRespDisplay from "@/components/agentRespDisplay";
import Microphone from "@/components/microphone";
import TranscriptDisplay from "@/components/transcriptDisplay";
import ServerStatus from "@/components/serverStatus";
import { v4 as uuidv4 } from "uuid";
import { connectSocket } from "@/components/socket";

// --- lightweight inline icons (no extra deps) ---
const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.68c-2.77.6-3.36-1.19-3.36-1.19-.45-1.15-1.1-1.46-1.1-1.46-.9-.61.07-.6.07-.6 1 .07 1.52 1.05 1.52 1.05.89 1.52 2.34 1.08 2.91.83.09-.64.35-1.08.63-1.33-2.21-.25-4.54-1.11-4.54-4.95 0-1.09.39-1.98 1.03-2.67-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.7.12 2.5.35 1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.69 1.03 1.58 1.03 2.67 0 3.85-2.33 4.7-4.55 4.95.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>
  </svg>
);

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.84v2.05h.06c.53-1 1.8-2.05 3.7-2.05 3.96 0 4.7 2.6 4.7 5.98V23h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V23h-4V8z"/>
  </svg>
);

export default function Home() {
  const [responses, setResponses] = useState<string[]>([]);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [sessionId] = useState<string>(uuidv4());

  const onTranscript = useCallback((t: string) => {
    const s = t.trim();
    if (s) setTranscripts((prev) => [s, ...prev]);
  }, []);

  const onAgentResponse = useCallback((r: string) => {
    const s = r.trim();
    if (s) setResponses((prev) => [s, ...prev]);
  }, []);

  useEffect(() => {
    const socket = connectSocket(sessionId, (msg) => {
      if (msg.transcript_result) onTranscript(msg.transcript_result);
      else if (msg.agent_response) onAgentResponse(msg.agent_response);
      else if ("transcript_stage" in msg) console.log("Stage:", msg.transcript_stage);
    });
    return () => {
      socket.close();
    };
  }, [sessionId, onTranscript, onAgentResponse]);

  return (
    <>
      <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-gradient-to-b from-neutral-50 to-white">
        <main className="row-start-2 flex flex-col gap-8 items-start">
          <header className="w-full">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Adharsh’s Interactive Resume</h1>
            <p className="mt-1 text-sm text-neutral-600">Resumes are dead PDFs. This one talks back.</p>
          </header>

          {/* Instructions + Examples */}
          <InfoPanel />

          {/* Live system status */}
          <ServerStatus />

          {/* Agent responses stream */}
          <section className="w-full">
            <AgentRespDisplay responses={responses} />
          </section>

          {/* Mic controls */}
          <section className="w-full">
            <Microphone sessionId={sessionId} />
          </section>

          {/* Transcript history */}
          <section className="w-full">
            <TranscriptDisplay transcripts={transcripts} />
          </section>
        </main>

        <footer className="row-start-3 flex items-center gap-6 justify-center text-sm text-neutral-500">
          <a
            href="https://github.com/AdharshKOTN"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-neutral-700 transition-colors"
          >
            <GitHubIcon className="h-6 w-6" />
          </a>
          <a
            href="https://www.linkedin.com/in/adharsh-rajendran"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-neutral-700 transition-colors"
          >
            <LinkedInIcon className="h-6 w-6" />
          </a>
        </footer>
      </div>
    </>
  );
}
