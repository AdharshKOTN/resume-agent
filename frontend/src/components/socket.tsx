// src/lib/socket.ts
import { io } from "socket.io-client";

const socket = io(process.env.BACKEND_WS_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;