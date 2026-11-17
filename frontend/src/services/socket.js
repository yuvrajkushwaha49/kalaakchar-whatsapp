import { io } from 'socket.io-client';

let socket = null;

export function initSocket() {
  const token = localStorage.getItem('cf_token');
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  let socketUrl = import.meta.env.VITE_SOCKET_URL;
  if (!socketUrl) {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        socketUrl = 'http://localhost:5000';
      } else {
        socketUrl = window.location.origin;
      }
    } else {
      socketUrl = 'http://localhost:5000';
    }
  }

  socket = io(socketUrl, {
    auth: {
      token: `Bearer ${token}`
    },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
  });

  socket.on('connect', () => {
    // Connected to tenant real-time room
  });

  socket.on('connect_error', (err) => {
    console.debug('[Socket:Client] Real-time connection notice:', err.message);
  });

  return socket;
}

export function getSocket() {
  if (!socket) return initSocket();
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  initSocket,
  getSocket,
  disconnectSocket
};
