// src/lib/socket.ts
"use client";
import { io, Socket } from "socket.io-client";

declare global {
  interface GlobalThis {
      __appSocket?: Socket;
  }
}

const URL  = process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? "";

function create(): Socket {
  return io(URL, {
    autoConnect: false,           // ← you will call connect() yourself
    transports: ["websocket"],
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 4000,
    // withCredentials: true,     // enable if you rely on cookies across origins
  });
}

export function getSocket(): Socket {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return ((globalThis as unknown as { __appSocket?: Socket }).__appSocket ??= create());
}

export function connectSocket(sessionId: string): Socket {
  const s = getSocket();
  // attach handshake data before connecting (or reconnecting)
  if ((s as any).auth?.session_id !== sessionId) s.auth = { session_id: sessionId };
  if (!s.connected) s.connect();
  return s;
}