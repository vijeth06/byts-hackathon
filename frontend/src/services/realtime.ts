import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectRealtime = (userId?: string, institutionId?: string) => {
  if (socket) return socket;

  // Keep socket host aligned with API host (API defaults to localhost:3000).
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const normalized = baseUrl.replace(/\/api\/v1$/i, '');

  const query: Record<string, string> = {};
  if (userId) query.userId = userId;
  if (institutionId) query.institutionId = institutionId;

  socket = io(normalized, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    query,
  });

  return socket;
};

export const getRealtimeSocket = () => socket;

export const disconnectRealtime = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
