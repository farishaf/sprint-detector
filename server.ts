import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface ClientInfo {
  ws: WebSocket;
  roomId: string;
  role: 'START' | 'FINISH' | 'MONITOR' | 'SOLO';
  deviceName: string;
}

interface RoomState {
  roomId: string;
  isTimerRunning: boolean;
  startTimeMs: number | null;
  elapsedMs: number;
  currentAthlete: any | null;
  lastSplit: any | null;
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Real-time Multi-Device WebSocket Management
const clients = new Map<WebSocket, ClientInfo>();
const roomStates = new Map<string, RoomState>();

function getOrCreateRoomState(roomId: string): RoomState {
  if (!roomStates.has(roomId)) {
    roomStates.set(roomId, {
      roomId,
      isTimerRunning: false,
      startTimeMs: null,
      elapsedMs: 0,
      currentAthlete: null,
      lastSplit: null,
    });
  }
  return roomStates.get(roomId)!;
}

function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  clients.forEach((info, ws) => {
    if (info.roomId === roomId && ws.readyState === WebSocket.OPEN && ws !== excludeWs) {
      ws.send(payload);
    }
  });
}

function sendRoomSummary(roomId: string) {
  let startCount = 0;
  let finishCount = 0;
  let monitorCount = 0;

  clients.forEach((info) => {
    if (info.roomId === roomId) {
      if (info.role === 'START') startCount++;
      else if (info.role === 'FINISH') finishCount++;
      else if (info.role === 'MONITOR') monitorCount++;
    }
  });

  const state = getOrCreateRoomState(roomId);
  broadcastToRoom(roomId, {
    type: 'ROOM_SYNC',
    roomId,
    serverTimeMs: Date.now(),
    roomState: state,
    deviceCounts: {
      start: startCount,
      finish: finishCount,
      monitors: monitorCount,
      total: startCount + finishCount + monitorCount,
    },
  });
}

wss.on('connection', (ws) => {
  clients.set(ws, {
    ws,
    roomId: 'DEFAULT',
    role: 'SOLO',
    deviceName: 'Device',
  });

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const client = clients.get(ws);
      if (!client) return;

      switch (data.type) {
        case 'JOIN_ROOM': {
          const roomId = (data.roomId || 'GATE-1').toUpperCase().trim();
          client.roomId = roomId;
          client.role = data.role || 'SOLO';
          client.deviceName = data.deviceName || 'Device';

          const roomState = getOrCreateRoomState(roomId);

          // Acknowledge connection
          ws.send(
            JSON.stringify({
              type: 'JOINED_SUCCESS',
              roomId,
              role: client.role,
              serverTimeMs: Date.now(),
              roomState,
            })
          );

          sendRoomSummary(roomId);
          break;
        }

        case 'TRIGGER_START': {
          const roomState = getOrCreateRoomState(client.roomId);
          const startTimeMs = data.startTimeMs || Date.now();
          roomState.isTimerRunning = true;
          roomState.startTimeMs = startTimeMs;
          if (data.athlete) {
            roomState.currentAthlete = data.athlete;
          }

          broadcastToRoom(
            client.roomId,
            {
              type: 'TIMER_STARTED',
              startTimeMs,
              serverTimeMs: Date.now(),
              triggeredByRole: client.role,
              athlete: data.athlete,
            }
          );
          break;
        }

        case 'TRIGGER_FINISH': {
          const roomState = getOrCreateRoomState(client.roomId);
          roomState.isTimerRunning = false;
          roomState.lastSplit = data.splitData;

          broadcastToRoom(
            client.roomId,
            {
              type: 'TIMER_STOPPED',
              finishTimeMs: data.finishTimeMs || Date.now(),
              elapsedMs: data.elapsedMs,
              triggeredByRole: client.role,
              splitData: data.splitData,
              capturedImageUri: data.capturedImageUri,
            }
          );
          break;
        }

        case 'RESET_TIMER': {
          const roomState = getOrCreateRoomState(client.roomId);
          roomState.isTimerRunning = false;
          roomState.startTimeMs = null;
          roomState.elapsedMs = 0;

          broadcastToRoom(client.roomId, {
            type: 'TIMER_RESET',
            triggeredByRole: client.role,
          });
          break;
        }

        case 'SELECT_ATHLETE': {
          const roomState = getOrCreateRoomState(client.roomId);
          roomState.currentAthlete = data.athlete;

          broadcastToRoom(client.roomId, {
            type: 'ATHLETE_CHANGED',
            athlete: data.athlete,
          });
          break;
        }

        case 'PING': {
          ws.send(JSON.stringify({ type: 'PONG', serverTimeMs: Date.now() }));
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('WebSocket Error:', e);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      const roomId = client.roomId;
      clients.delete(ws);
      sendRoomSummary(roomId);
    }
  });
});

// Vite or Static file serving
async function startApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startApp();
