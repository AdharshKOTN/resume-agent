// src/lib/socket.ts
"use client";

let socket: WebSocket | null = null;

export function connectSocket(sessionId: string, onMessage: (msg: any) => void): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL + `/api/ws/session/${sessionId}`;

  if (socket) {
    socket.close();
  }

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("✅ WebSocket connected for session", sessionId);
  };

  socket.onmessage = (event) => {
    // console.log(event);
    const d = event.data;
    // console.log(typeof d);
    try {
      let msg: any;
      if (typeof (d) === 'string') {
        msg = JSON.parse(d);
      }
      else {
        console.warn("WD: unknown payload", d)
        return;
      }
      onMessage(msg);
    } catch (err) {
      console.error(err)
      console.error("Failed to parse WS message:", event.data);
    }
  };

  socket.onclose = () => {
    // console.log("WebSocket closed");
    socket = null;
  };

  socket.onerror = (err) => {
    console.error("⚠️ WebSocket error", err);
  };

  return socket;
}