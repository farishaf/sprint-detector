export interface Athlete {
  id: string;
  name: string;
  bibNumber: number;
  category: string; // e.g. "U17", "U20", "Senior"
  team?: string;
}

export interface LapSplit {
  id: string;
  splitIndex: number;
  label: string;
  timestampMs: number;
  elapsedMs: number;
  diffFromPrevMs: number;
  capturedImageUri?: string;
  speedMs?: number; // m/s
  speedKmh?: number; // km/h
}

export interface SprintSession {
  id: string;
  athleteId: string;
  athleteName: string;
  bibNumber: number;
  category: string;
  testTitle: string; // e.g. "10m sprint test"
  distanceMeters: number;
  totalTimeMs: number;
  topSpeedKmh: number;
  date: string;
  splits: LapSplit[];
}

export type StartMode = 'MOTION_LINE' | 'SOUND_GUN' | 'COUNTDOWN' | 'MANUAL';

export interface DetectionConfig {
  sensitivity: number; // 5 - 50 (percentage pixel diff)
  lineOrientation: 'VERTICAL' | 'HORIZONTAL';
  linePosition: number; // 0 - 100 percentage across canvas
  triggerCooldownMs: number; // default 1500ms
  startMode: StartMode;
  countdownSeconds: number;
  distanceMeters: number;
  autoArmOnStart: boolean;
  soundBeepEnabled: boolean;
  testTitle: string;
  categoryLabel: string;
}

export type DetectorState = 'IDLE' | 'ARMED' | 'COUNTDOWN' | 'RUNNING' | 'FINISHED';

export type DeviceRole = 'START' | 'FINISH' | 'MONITOR' | 'SOLO';

export interface MultiDeviceSyncState {
  roomId: string;
  role: DeviceRole;
  isConnected: boolean;
  deviceName: string;
  deviceCounts: {
    start: number;
    finish: number;
    monitors: number;
    total: number;
  };
}
