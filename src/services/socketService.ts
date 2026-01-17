import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private readonly SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('[SOCKET] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('[SOCKET] Disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SOCKET] Connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[SOCKET] Not connected, cannot emit:', event);
    }
  }

  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string): void {
    this.socket?.off(event);
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
