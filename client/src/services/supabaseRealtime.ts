import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

type EventHandler = (...args: any[]) => void;

class SupabaseRealtimeService {
  private channel: RealtimeChannel | null = null;
  private currentRoomCode: string | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  public isConnected: boolean = false;
  public id: string = 'supabase_' + Math.random().toString(36).substring(2, 9);

  public joinRoomChannel(roomCode: string, userMeta?: { id?: string; name?: string; role?: 'host' | 'player' }): RealtimeChannel | null {
    if (!supabase || !isSupabaseConfigured) return null;
    const cleanCode = roomCode.trim().toUpperCase();

    if (this.channel && this.currentRoomCode === cleanCode) {
      return this.channel;
    }

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    this.currentRoomCode = cleanCode;
    const channelName = `game_room_${cleanCode}`;

    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: userMeta?.id || this.id },
      },
    });

    // Handle incoming broadcasts
    this.channel.on('broadcast', { event: '*' }, (payload: any) => {
      const eventName = payload.event;
      const data = payload.payload;
      this.trigger(eventName, data);
    });

    // Handle presence sync (connected player list)
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel?.presenceState();
      if (!state) return;
      const players: Array<{ id: string; name: string; isConnected: boolean }> = [];

      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          if (p.role === 'player' && p.name) {
            players.push({
              id: p.id || p.key,
              name: p.name,
              isConnected: true,
            });
          }
        });
      });

      this.trigger('player:list_updated', { players });
    });

    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.isConnected = true;
        this.trigger('connect');
        if (userMeta) {
          await this.channel?.track({
            id: userMeta.id || this.id,
            name: userMeta.name || 'User',
            role: userMeta.role || 'player',
            joinedAt: Date.now(),
          });
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        this.isConnected = false;
        this.trigger('disconnect', status);
      }
    });

    return this.channel;
  }

  public emit(eventName: string, data?: any, callback?: Function) {
    if (this.channel && isSupabaseConfigured) {
      this.channel
        .send({
          type: 'broadcast',
          event: eventName,
          payload: data,
        })
        .then(() => {
          if (callback) callback({ success: true });
        })
        .catch((err) => {
          console.warn(`[Supabase Realtime] Broadcast error on ${eventName}:`, err);
          if (callback) callback({ success: false, error: err.message });
        });
    } else if (callback) {
      callback({ success: false, error: 'Supabase Realtime channel not connected' });
    }
  }

  public on(eventName: string, handler: EventHandler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(handler);
  }

  public off(eventName: string, handler?: EventHandler) {
    if (!handler) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.get(eventName)?.delete(handler);
    }
  }

  public trigger(eventName: string, data?: any) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error(`Error in realtime handler for ${eventName}:`, err);
        }
      });
    }
  }

  public leave() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.currentRoomCode = null;
    this.isConnected = false;
  }
}

export const supabaseRealtime = new SupabaseRealtimeService();
