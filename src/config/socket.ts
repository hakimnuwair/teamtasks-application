import { io, Socket } from "socket.io-client";

// Singleton — one socket instance for the entire app lifetime
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      autoConnect: false, // we control when to connect (after login)
      withCredentials: true,
      transports: ["websocket"],
    });
  }
  return socket;
};

export const connectSocket = (userId: string): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    // Join the user's personal room so backend can send targeted notifications
    s.emit("join", userId);
  }
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
