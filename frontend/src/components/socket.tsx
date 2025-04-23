// src/lib/socket.ts
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Or your backend URL

export default socket;