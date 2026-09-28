import { io, Socket } from 'socket.io-client';
import { clientGameEngine } from './clientGameEngine';
import { isSupabaseConfigured, supabase } from './supabase';

const envServerUrl = (import.meta as any).env?.VITE_SERVER_URL;
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Only use local socket.io server if explicitly on localhost with dev port or if VITE_SERVER_URL is provided
export const SERVER_URL =
  envServerUrl || (isLocalhost ? `http://${window.location.hostname}:3001` : '');

export const hasLiveBackend = Boolean(envServerUrl || isLocalhost);

class UnifiedSocketService {
  private socket: Socket | null = null;
  private isClientMode = !hasLiveBackend;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    if (hasLiveBackend && SERVER_URL) {
      try {
        this.socket = io(SERVER_URL, {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1500,
          timeout: 4000,
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect_error', () => {
          // Quietly fallback to client mode on connection issues without flooding console
          this.isClientMode = true;
        });

        this.socket.on('connect', () => {
          this.isClientMode = false;
        });
      } catch (e) {
        this.isClientMode = true;
      }
    } else {
      this.isClientMode = true;
    }

    // Forward clientGameEngine events to unified listeners
    const engineEvents = [
      'host:state_update',
      'player:state_update',
      'player:joined_room',
      'player:list_updated',
      'game:starting_countdown',
      'game:timer_tick',
      'player:kicked',
    ];

    engineEvents.forEach((evt) => {
      clientGameEngine.on(evt, (data: any) => {
        if (this.isClientMode) {
          this.trigger(evt, data);
        }
      });
    });
  }

  public getSocket(): any {
    return this;
  }

  public emit(eventName: string, data?: any, callback?: Function) {
    if (!this.isClientMode && this.socket && this.socket.connected) {
      this.socket.emit(eventName, data, callback);
      return;
    }

    // Client mode execution
    const { roomCode, hostToken, playerName, playerId, answers, selectedOption, completionTimeMs, reveal } =
      data || {};

    if (eventName === 'host:register') {
      const res = clientGameEngine.registerHost(roomCode, hostToken);
      if (callback) callback(res);
    } else if (eventName === 'player:join') {
      const res = clientGameEngine.addPlayer(roomCode, playerName);
      if (callback) callback(res);
    } else if (eventName === 'host:start_game') {
      clientGameEngine.startGame(roomCode);
      if (callback) callback({ success: true });
    } else if (eventName === 'host:next_round') {
      clientGameEngine.nextRound(roomCode);
      if (callback) callback({ success: true });
    } else if (eventName === 'host:start_quiz') {
      clientGameEngine.startQuiz(roomCode);
      if (callback) callback({ success: true });
    } else if (eventName === 'host:next_quiz') {
      clientGameEngine.nextQuiz(roomCode);
      if (callback) callback({ success: true });
    } else if (eventName === 'player:submit_round') {
      clientGameEngine.submitRound(roomCode, playerId, answers, completionTimeMs || 0);
      if (callback) callback({ success: true });
    } else if (eventName === 'player:submit_quiz') {
      clientGameEngine.submitQuiz(roomCode, playerId, selectedOption, completionTimeMs || 0);
      if (callback) callback({ success: true });
    } else if (eventName === 'host:reveal_leaderboard') {
      clientGameEngine.setRevealLeaderboard(roomCode, reveal);
      if (callback) callback({ success: true });
    } else if (eventName === 'host:end_game') {
      clientGameEngine.completeGame(roomCode);
      if (callback) callback({ success: true });
    } else if (callback) {
      callback({ success: true });
    }
  }

  public on(eventName: string, handler: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(handler);

    if (this.socket) {
      this.socket.on(eventName, handler as any);
    }
  }

  public off(eventName: string, handler?: Function) {
    if (!handler) {
      this.listeners.delete(eventName);
      if (this.socket) this.socket.off(eventName);
    } else {
      this.listeners.get(eventName)?.delete(handler);
      if (this.socket) this.socket.off(eventName, handler as any);
    }
  }

  private trigger(eventName: string, data?: any) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error(`Error in event ${eventName}:`, err);
        }
      });
    }
  }
}

export const socketService = new UnifiedSocketService();
