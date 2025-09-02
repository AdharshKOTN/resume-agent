// src/lib/socket.ts
"use client";

let socket: WebSocket | null = null;

type WsMsg = { agent_response?: string; transcript_result?: string; transcript_stage?: string | null };

export function connectSocket(sessionId: string, onMessage: (msg: WsMsg) => void) {
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === "dev";
  const devBase = (process.env.NEXT_PUBLIC_DEV_WS_BASE ?? "ws://127.0.0.1:5000").replace(/\/+$/, "");

  const wsUrl = isDev
    ? `${devBase}/api/ws/session/${sessionId}`  // e.g. ws://127.0.0.1:5000/api/ws/session/abc
    : `/api/ws/session/${sessionId}`;          // relative → resolves to ws(s)://<current-host>/...

  if (socket) socket.close();
  socket = new WebSocket(wsUrl);

  socket.onopen = () => console.log("✅ WS connected:", wsUrl);

  socket.onmessage = (event) => {
    if (typeof event.data !== "string") return;
    try { onMessage(JSON.parse(event.data) as WsMsg); }
    catch (e) { console.error("WS JSON parse failed:", e); }
  };

  socket.onclose = () => { socket = null; };
  socket.onerror  = (err) => console.error("⚠️ WS error", err);

  return socket!;
}
