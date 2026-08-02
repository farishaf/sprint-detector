import { useEffect, useRef, useState, useCallback } from 'react';
import { Athlete, DeviceRole, LapSplit, MultiDeviceSyncState } from '../types';

interface UseMultiDeviceSyncProps {
  onRemoteStart: (startTimeMs: number, athlete?: Athlete) => void;
  onRemoteFinish: (
    finishTimeMs: number,
    elapsedMs: number,
    splitData?: LapSplit,
    capturedImageUri?: string
  ) => void;
  onRemoteReset: () => void;
  onRemoteAthleteChange: (athlete: Athlete) => void;
}

export function useMultiDeviceSync({
  onRemoteStart,
  onRemoteFinish,
  onRemoteReset,
  onRemoteAthleteChange,
}: UseMultiDeviceSyncProps) {
  const [syncState, setSyncState] = useState<MultiDeviceSyncState>({
    roomId: 'SPRINT-1',
    role: 'SOLO',
    isConnected: false,
    deviceName: typeof window !== 'undefined' && navigator.userAgent.includes('Android') ? 'HP Android' : 'Laptop / Web',
    deviceCounts: { start: 0, finish: 0, monitors: 0, total: 0 },
  });

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Callbacks refs to avoid stale closures
  const callbacksRef = useRef({
    onRemoteStart,
    onRemoteFinish,
    onRemoteReset,
    onRemoteAthleteChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onRemoteStart,
      onRemoteFinish,
      onRemoteReset,
      onRemoteAthleteChange,
    };
  }, [onRemoteStart, onRemoteFinish, onRemoteReset, onRemoteAthleteChange]);

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setSyncState((prev) => ({ ...prev, isConnected: true }));
        // Join room immediately upon connecting
        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomId: syncState.roomId,
            role: syncState.role,
            deviceName: syncState.deviceName,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'JOINED_SUCCESS':
              setSyncState((prev) => ({ ...prev, isConnected: true }));
              break;

            case 'ROOM_SYNC':
              setSyncState((prev) => ({
                ...prev,
                deviceCounts: data.deviceCounts || prev.deviceCounts,
              }));
              break;

            case 'TIMER_STARTED':
              callbacksRef.current.onRemoteStart(data.startTimeMs, data.athlete);
              break;

            case 'TIMER_STOPPED':
              callbacksRef.current.onRemoteFinish(
                data.finishTimeMs,
                data.elapsedMs,
                data.splitData,
                data.capturedImageUri
              );
              break;

            case 'TIMER_RESET':
              callbacksRef.current.onRemoteReset();
              break;

            case 'ATHLETE_CHANGED':
              if (data.athlete) {
                callbacksRef.current.onRemoteAthleteChange(data.athlete);
              }
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('Error parsing ws message', err);
        }
      };

      ws.onclose = () => {
        setSyncState((prev) => ({ ...prev, isConnected: false }));
        // Auto-reconnect after 2 seconds
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection warning:', err);
        ws.close();
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  }, [syncState.roomId, syncState.role, syncState.deviceName]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null; // avoid reconnection loop on unmount
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Keepalive ping interval
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 15000);

    return () => clearInterval(pingInterval);
  }, []);

  const triggerStart = useCallback(
    (startTimeMs?: number, athlete?: Athlete) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'TRIGGER_START',
            startTimeMs: startTimeMs || Date.now(),
            athlete,
          })
        );
      }
    },
    []
  );

  const triggerFinish = useCallback(
    (
      finishTimeMs: number,
      elapsedMs: number,
      splitData?: LapSplit,
      capturedImageUri?: string
    ) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'TRIGGER_FINISH',
            finishTimeMs,
            elapsedMs,
            splitData,
            capturedImageUri,
          })
        );
      }
    },
    []
  );

  const resetTimer = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'RESET_TIMER',
        })
      );
    }
  }, []);

  const selectAthlete = useCallback((athlete: Athlete) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'SELECT_ATHLETE',
          athlete,
        })
      );
    }
  }, []);

  const changeRoomAndRole = useCallback(
    (newRoomId: string, newRole: DeviceRole) => {
      const cleanRoom = newRoomId.toUpperCase().trim() || 'SPRINT-1';
      setSyncState((prev) => ({
        ...prev,
        roomId: cleanRoom,
        role: newRole,
      }));

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomId: cleanRoom,
            role: newRole,
            deviceName: syncState.deviceName,
          })
        );
      }
    },
    [syncState.deviceName]
  );

  return {
    syncState,
    triggerStart,
    triggerFinish,
    resetTimer,
    selectAthlete,
    changeRoomAndRole,
  };
}
