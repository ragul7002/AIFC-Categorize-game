import mqtt, { MqttClient } from 'mqtt';

type MessageHandler = (eventName: string, data: any) => void;

class GlobalRealtimeRelay {
  private client: MqttClient | null = null;
  private currentTopic: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  public isConnected: boolean = false;
  private pendingPublish: Array<{ topic: string; message: string }> = [];

  constructor() {
    this.initMqtt();
  }

  private initMqtt() {
    try {
      const clientId = 'aifc_' + Math.random().toString(36).substring(2, 10);
      // EMQX public high-availability global WebSocket MQTT broker
      this.client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
        keepalive: 60,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('🌐 Connected to Global Multiplayer Relay');

        if (this.currentTopic) {
          this.client?.subscribe(this.currentTopic + '/#', { qos: 1 });
        }

        // Send pending publishes
        while (this.pendingPublish.length > 0) {
          const item = this.pendingPublish.shift();
          if (item) {
            this.client?.publish(item.topic, item.message, { qos: 1 });
          }
        }
      });

      this.client.on('message', (topic, payload) => {
        try {
          const raw = payload.toString();
          const parsed = JSON.parse(raw);
          const { eventName, data } = parsed;
          if (eventName) {
            this.trigger(eventName, data);
          }
        } catch (e) {
          // ignore unparseable payload
        }
      });

      this.client.on('error', (err) => {
        console.warn('Relay connection notice:', err.message);
      });
    } catch (err) {
      console.warn('Failed to initialize MQTT relay:', err);
    }
  }

  public subscribeRoom(roomCode: string) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    this.currentTopic = `aifc_multiplayer_game/room_${cleanCode}`;

    if (this.client && this.isConnected) {
      this.client.subscribe(this.currentTopic + '/#', { qos: 1 });
    }
  }

  public broadcastEvent(roomCode: string, eventName: string, data: any) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    const topic = `aifc_multiplayer_game/room_${cleanCode}/events`;
    const message = JSON.stringify({ eventName, data, senderTimestamp: Date.now() });

    if (this.client && this.isConnected) {
      this.client.publish(topic, message, { qos: 1 });
    } else {
      this.pendingPublish.push({ topic, message });
    }
  }

  public on(eventName: string, handler: (data: any) => void) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(handler);
  }

  public off(eventName: string, handler?: (data: any) => void) {
    if (!handler) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.get(eventName)?.delete(handler);
    }
  }

  public trigger(eventName: string, data: any) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error(`Error in relay handler for ${eventName}:`, e);
        }
      });
    }
  }
}

export const globalRelay = new GlobalRealtimeRelay();
