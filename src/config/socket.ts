/**
 * config/socket.ts — Socket.io singleton.
 *
 * BUGS FIXED:
 *  1. Wrong port: always derive BASE_URL from VITE_API_BASE_URL (strip /api/v1).
 *     Do NOT use VITE_SOCKET_URL — it was causing port 5001 fallback.
 *  2. Double "join" emit: connectSocket() no longer emits join directly.
 *     The "connect" event handler is the single source of truth.
 *     This prevents the duplicate "join" visible in browser devtools.
 *
 * Backend MUST have this handler in server.js (see backend-socket-setup.md):
 *   io.on("connection", socket => {
 *     socket.on("join", userId => socket.join(String(userId)));
 *   });
 */

import { io, type Socket } from "socket.io-client";

// Always strip /api/v1 from the API base URL to get the socket server URL.
// Never use a separate VITE_SOCKET_URL — it caused the port 5001 bug.
const BASE_URL = (() => {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (apiBase) return apiBase.replace(/\/api\/v1\/?$/, "");
  return "http://localhost:5000";
})();

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

    // Single place where "join" is emitted — on every (re)connect.
    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket!.id);
      if (_userId) socket!.emit("join", _userId);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });
  }
  return socket;
};

/** Called after login or session restore. Connects and joins the user's room. */
export const connectSocket = (userId: string): void => {
  _userId = userId;
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    // NOTE: do NOT emit "join" here. The "connect" event handler does it.
    // Emitting here as well causes the double-join bug visible in devtools.
  } else {
    // Already connected (e.g. reconnected before userId was set) — emit now
    s.emit("join", userId);
  }
};

/** Called on logout. Disconnects and clears the singleton so next login gets a fresh socket. */
export const disconnectSocket = (): void => {
  _userId = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
