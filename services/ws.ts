// src/services/ws.ts
import Constants from 'expo-constants';

const WS_URL: string =
  (Constants.expoConfig?.extra?.wsUrl as string | undefined) ?? 'ws://localhost:3000';

export type WsEventType =
  | 'item:added'
  | 'item:updated'
  | 'item:removed'
  | 'item:checking'
  | 'list:updated'
  | 'store:updated'
  | 'trip:completed'
  | 'ping'
  | 'pong';

export interface WsMessage {
  type: WsEventType;
  payload?: unknown;
}

type Listener = (msg: WsMessage) => void;

class WsClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private closing = false;
  private listId: string | null = null;
  private token: string | null = null;

  onStatusChange?: (status: 'live' | 'pending' | 'offline') => void;

  connect(listId: string, token: string) {
    this.listId = listId;
    this.token = token;
    this.closing = false;
    this._open();
  }

  disconnect() {
    this.closing = true;
    this._cleanup();
  }

  send(msg: WsMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private _open() {
    if (!this.listId || !this.token) return;
    this.onStatusChange?.('pending');
    const url = `${WS_URL}/ws/lists/${this.listId}?token=${encodeURIComponent(this.token)}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.onStatusChange?.('live');
      this._startPing();
    };
    this.socket.onmessage = (e) => {
      try {
        const msg: WsMessage = JSON.parse(e.data as string);
        if (msg.type === 'pong') return;
        this.listeners.forEach((fn) => fn(msg));
      } catch {}
    };
    this.socket.onclose = () => {
      this._stopPing();
      this.onStatusChange?.('offline');
      if (!this.closing) {
        this.reconnectTimer = setTimeout(() => this._open(), 3000);
      }
    };
    this.socket.onerror = () => this.socket?.close();
  }

  private _cleanup() {
    this._stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
  }

  private _startPing() {
    this.pingTimer = setInterval(() => this.send({ type: 'ping' }), 25_000);
  }
  private _stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }
}

export const wsClient = new WsClient();
