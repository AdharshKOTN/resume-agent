// src/lib/socket.ts
import { io } from "socket.io-client";

const socket = io(process.env.BACKEND_URL);

export default socket;