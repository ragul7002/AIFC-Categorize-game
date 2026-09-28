import { io, Socket } from 'socket.io-client';

export const SERVER_URL =
  (import.meta as any).env?.VITE_SERVER_URL ||
  (window.location.port === '5173'
    ? `http://${window.location.hostname}:3001`
    : window.location.origin);

class SocketService {
  private socket: Socket | null = null;

  public getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(SERVER_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('⚡ Connected to game server:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from game server:', reason);
      });
    }

    return this.socket;
  }
}

export const socketService = new SocketService();
