/**
 * src/config/socket.ts
 *
 * SINGLETON SOCKET — one instance for the entire app lifetime.
 *
 * Rules:
 *   - Created lazily on first getSocket() call
 *   - autoConnect: false — we connect ONLY after auth succeeds
 *   - transports: ["websocket"] — skip long-polling, instant connection
 *   - Stores userId so "join" is re-emitted automatically after reconnect
 *   - disconnectSocket() wipes the singleton so next login gets a fresh instance
 */
import { io, type Socket } from "socket.io-client";

const BASE_URL =
  import.meta.env.VITE_SOCKET_URL ??
  (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001").replace(
    /\/api\/v1\/?$/,
    "",
  );

let socket: Socket | null = null;
let _userId: string | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(BASE_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Re-join personal room after any reconnect (network drop, server restart)
    socket.on("connect", () => {
      if (_userId) socket!.emit("join", _userId);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] connect error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.info("[Socket] disconnected:", reason);
    });
  }
  return socket;
};

/** Call immediately after login / session restore. */
export const connectSocket = (userId: string): void => {
  _userId = userId;
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  } else {
    // Already connected (e.g. token refresh) — re-join room to be safe
    s.emit("join", userId);
  }
};

/** Call on logout. Tears down the connection and wipes the singleton. */
export const disconnectSocket = (): void => {
  _userId = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
