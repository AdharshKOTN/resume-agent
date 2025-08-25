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
    autoConnect: false,
    transports: ["websocket"],
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 4000,
  });
}

export function getSocket(): Socket {
  return ((globalThis as unknown as { __appSocket?: Socket }).__appSocket ??= create());   // eslint-ignore-line typescript-eslint/no-excplicit-any
}

export function connectSocket(sessionId: string): Socket {
  const s = getSocket();
  // attach handshake data before connecting (or reconnecting)
  if ((s as any).auth?.session_id !== sessionId) s.auth = { session_id: sessionId };
  if (!s.connected) s.connect();
  return s;
}