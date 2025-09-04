import { useState } from "react";

export default function InfoPanel() {
  const [open, setOpen] = useState(true);

  return (
    <section
      aria-label="How to use this interactive resume"
      className={`w-full transition-all ${open ? "" : "opacity-90"}`}
    >
      <div className="rounded-2xl border border-neutral-200 bg-white/60 shadow-sm backdrop-blur p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-semibold">How this works</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Press the mic, talk, release. I transcribe locally, send text to my agent, and stream the reply back. If the
              connection drops, check <span className="font-medium">Server Status</span> below and try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
            aria-expanded={open}
            aria-controls="info-content"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>

        {open && (
          <div id="info-content" className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="text-sm font-semibold">Quick start</h3>
              <ol className="mt-2 space-y-2 text-sm text-neutral-700 list-decimal list-inside">
                <li>Check <span className="font-medium">Server Status</span> shows healthy.</li>
                <li>Click <span className="font-medium">Record</span>, speak clearly near your mic.</li>
                <li>Pause, then allow for the <span className="font-medium">Silence Detection</span> to send for transcription.</li>
                <li>Watch <span className="font-medium">Agent Responses</span> stream in.</li>
              </ol>
              <p className="mt-3 text-xs text-neutral-500">
                Tip: On mobile, if live detection struggles, use the fallback recorder to capture and submit.
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h3 className="text-sm font-semibold">Ask about</h3>
              <ul className="mt-2 space-y-2 text-sm text-neutral-700 list-disc list-inside">
                <li>"Summarize Adharsh's <span className="font-medium">work experience</span>."</li>
                <li>"What <span className="font-medium">projects</span> has Adharsh built in AI and backend systems?"</li>
                <li>"Explain his role at <span className="font-medium">IBM</span> and what he accomplished there."</li>
                <li>"What are some examples of <span className="font-medium">system design</span> problems he has solved?"</li>
                <li>"What <span className="font-medium">skills and tools</span> does he use most often?"</li>
              </ul>
            </div>

            <div className="rounded-xl border bg-white p-4 sm:col-span-2">
              <h3 className="text-sm font-semibold">What's under the hood</h3>
              <p className="mt-2 text-sm text-neutral-700">
                Next.js + TypeScript frontend, FastAPI gateway, Flask microservices for transcription and personality,
                Ollama-backed LLM, FAISS vector store, and Redis for queues + idempotency. Deployed across a
                Raspberry Pi edge (Nginx, Cloudflare Tunnel) and a GPU workstation (WSL2) for heavy AI.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}