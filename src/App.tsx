import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Athlete, DetectionConfig, DetectorState, DeviceRole, LapSplit, SprintSession } from './types';
import { Header } from './components/Header';
import { CameraDetectorView } from './components/CameraDetectorView';
import { TimerDisplay } from './components/TimerDisplay';
import { SplitLogsPanel } from './components/SplitLogsPanel';
import { AthleteManagerModal } from './components/AthleteManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { MultiDeviceSyncModal } from './components/MultiDeviceSyncModal';
import { HistoryLeaderboard } from './components/HistoryLeaderboard';
import { MotionAnalysisResult } from './utils/motionEngine';
import { playBeep, playCountdownBeep, playFinishBeep, playStartGunBeep } from './utils/sound';
import { useMultiDeviceSync } from './utils/useMultiDeviceSync';

// Initial default athletes
const INITIAL_ATHLETES: Athlete[] = [
  { id: 'ath-1', name: 'khalil', bibNumber: 4, category: 'U17', team: 'Akademi Football' },
  { id: 'ath-2', name: 'Rizaldi', bibNumber: 7, category: 'U20', team: 'Sprint Club' },
  { id: 'ath-3', name: 'Ahmad', bibNumber: 12, category: 'Senior', team: 'Athletic Team' },
];

const INITIAL_CONFIG: DetectionConfig = {
  sensitivity: 18,
  lineOrientation: 'VERTICAL',
  linePosition: 50,
  triggerCooldownMs: 1200,
  startMode: 'MOTION_LINE',
  countdownSeconds: 3,
  distanceMeters: 10,
  autoArmOnStart: true,
  soundBeepEnabled: true,
  testTitle: '10m sprint test',
  categoryLabel: 'U17',
};

export default function App() {
  const [athletes, setAthletes] = useState<Athlete[]>(() => {
    const saved = localStorage.getItem('sprint_athletes');
    return saved ? JSON.parse(saved) : INITIAL_ATHLETES;
  });

  const [selectedAthlete, setSelectedAthlete] = useState<Athlete>(athletes[0] || INITIAL_ATHLETES[0]);

  const [config, setConfig] = useState<DetectionConfig>(() => {
    const saved = localStorage.getItem('sprint_config');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [detectorState, setDetectorState] = useState<DetectorState>('ARMED');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Timer state
  const [elapsedMs, setElapsedMs] = useState<number>(2550);
  const [splits, setSplits] = useState<LapSplit[]>([]);
  const [historySessions, setHistorySessions] = useState<SprintSession[]>(() => {
    const saved = localStorage.getItem('sprint_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Modals
  const [isAthleteModalOpen, setIsAthleteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // High precision timer refs
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSplitTimeRef = useRef<number>(0);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('sprint_athletes', JSON.stringify(athletes));
  }, [athletes]);

  useEffect(() => {
    localStorage.setItem('sprint_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('sprint_history', JSON.stringify(historySessions));
  }, [historySessions]);

  // Initial demo splits matching reference image layout
  useEffect(() => {
    if (splits.length === 0 && elapsedMs === 2550) {
      setSplits([
        {
          id: 'sp-1',
          splitIndex: 1,
          label: 'Start Gate',
          timestampMs: 0,
          elapsedMs: 0,
          diffFromPrevMs: 0,
        },
        {
          id: 'sp-2',
          splitIndex: 2,
          label: '10m Finish Trigger',
          timestampMs: 2550,
          elapsedMs: 2550,
          diffFromPrevMs: 2550,
          speedKmh: (10 / 2.55) * 3.6,
          speedMs: 10 / 2.55,
        },
      ]);
    }
  }, []);

  // Timer loop callback
  const updateTimer = useCallback(() => {
    if (startTimeRef.current !== null) {
      const now = performance.now();
      const currentElapsed = now - startTimeRef.current;
      setElapsedMs(currentElapsed);
      animFrameRef.current = requestAnimationFrame(updateTimer);
    }
  }, []);

  // Remote Handlers
  const handleStartTimerRemote = useCallback(
    (_startTimeMs: number) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const now = performance.now();
      startTimeRef.current = now;
      lastSplitTimeRef.current = now;
      setElapsedMs(0);
      setDetectorState('RUNNING');

      if (config.soundBeepEnabled) playStartGunBeep();

      const startSplit: LapSplit = {
        id: `split-${Date.now()}`,
        splitIndex: 1,
        label: 'Start Gate (0.00s)',
        timestampMs: now,
        elapsedMs: 0,
        diffFromPrevMs: 0,
      };
      setSplits([startSplit]);
      animFrameRef.current = requestAnimationFrame(updateTimer);
    },
    [config.soundBeepEnabled, updateTimer]
  );

  const handleStopTimerRemote = useCallback(
    (remoteElapsedMs: number, snapshotUri?: string) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setElapsedMs(remoteElapsedMs);
      setDetectorState('FINISHED');

      if (config.soundBeepEnabled) playFinishBeep();

      const distanceM = config.distanceMeters || 10;
      const timeSec = remoteElapsedMs / 1000;
      const speedMs = timeSec > 0 ? distanceM / timeSec : 0;
      const speedKmh = speedMs * 3.6;

      const finishSplit: LapSplit = {
        id: `split-${Date.now()}`,
        splitIndex: splits.length + 1,
        label: `Finish (${(remoteElapsedMs / 1000).toFixed(2)}s)`,
        timestampMs: performance.now(),
        elapsedMs: remoteElapsedMs,
        diffFromPrevMs: remoteElapsedMs,
        capturedImageUri: snapshotUri,
        speedMs,
        speedKmh,
      };

      const newSplits = [...splits, finishSplit];
      setSplits(newSplits);

      const session: SprintSession = {
        id: `session-${Date.now()}`,
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        bibNumber: selectedAthlete.bibNumber,
        category: selectedAthlete.category,
        testTitle: config.testTitle,
        distanceMeters: config.distanceMeters,
        totalTimeMs: remoteElapsedMs,
        topSpeedKmh: speedKmh,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        splits: newSplits,
      };

      setHistorySessions((prev) => [session, ...prev]);
    },
    [config.distanceMeters, config.soundBeepEnabled, config.testTitle, selectedAthlete, splits]
  );

  // Multi-Device Sync hook
  const {
    syncState,
    triggerStart,
    triggerFinish,
    resetTimer: syncResetTimer,
    selectAthlete: syncSelectAthlete,
    changeRoomAndRole,
  } = useMultiDeviceSync({
    onRemoteStart: (startTimeMs, athlete) => {
      if (athlete) setSelectedAthlete(athlete);
      handleStartTimerRemote(startTimeMs);
    },
    onRemoteFinish: (_finishTimeMs, elapsedMs, _splitData, capturedImageUri) => {
      handleStopTimerRemote(elapsedMs, capturedImageUri);
    },
    onRemoteReset: () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      startTimeRef.current = null;
      setElapsedMs(0);
      setSplits([]);
      setDetectorState('ARMED');
    },
    onRemoteAthleteChange: (athlete) => {
      setSelectedAthlete(athlete);
    },
  });

  // Check URL room and role params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const roleParam = params.get('role') as DeviceRole | null;
    if (roomParam) {
      const cleanRoom = roomParam.toUpperCase().startsWith('GATE-')
        ? roomParam.toUpperCase()
        : `GATE-${roomParam.toUpperCase()}`;
      const targetRole = roleParam || 'FINISH';
      changeRoomAndRole(cleanRoom, targetRole);
    }
  }, [changeRoomAndRole]);

  const startTimer = useCallback(
    (isLocalAction = true) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const now = performance.now();
      startTimeRef.current = now;
      lastSplitTimeRef.current = now;
      setElapsedMs(0);
      setDetectorState('RUNNING');

      if (config.soundBeepEnabled) {
        playStartGunBeep();
      }

      const startSplit: LapSplit = {
        id: `split-${Date.now()}`,
        splitIndex: 1,
        label: 'Start (0.00s)',
        timestampMs: now,
        elapsedMs: 0,
        diffFromPrevMs: 0,
      };
      setSplits([startSplit]);

      if (isLocalAction && syncState.role !== 'SOLO') {
        triggerStart(Date.now(), selectedAthlete);
      }

      animFrameRef.current = requestAnimationFrame(updateTimer);
    },
    [config.soundBeepEnabled, selectedAthlete, syncState.role, triggerStart, updateTimer]
  );

  const handleArmDetector = () => {
    setDetectorState('ARMED');
  };

  const handleStopTimer = useCallback(
    (finalSnapshotUri?: string, isLocalAction = true) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      const currentMs = elapsedMs;
      setDetectorState('FINISHED');

      if (config.soundBeepEnabled) {
        playFinishBeep();
      }

      const distanceM = config.distanceMeters || 10;
      const timeSec = currentMs / 1000;
      const speedMs = timeSec > 0 ? distanceM / timeSec : 0;
      const speedKmh = speedMs * 3.6;

      const finishSplit: LapSplit = {
        id: `split-${Date.now()}`,
        splitIndex: splits.length + 1,
        label: `Finish (${(currentMs / 1000).toFixed(2)}s)`,
        timestampMs: performance.now(),
        elapsedMs: currentMs,
        diffFromPrevMs: currentMs - (splits[splits.length - 1]?.elapsedMs || 0),
        capturedImageUri: finalSnapshotUri,
        speedMs,
        speedKmh,
      };

      const newSplits = [...splits, finishSplit];
      setSplits(newSplits);

      const session: SprintSession = {
        id: `session-${Date.now()}`,
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        bibNumber: selectedAthlete.bibNumber,
        category: selectedAthlete.category,
        testTitle: config.testTitle,
        distanceMeters: config.distanceMeters,
        totalTimeMs: currentMs,
        topSpeedKmh: speedKmh,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        splits: newSplits,
      };

      setHistorySessions((prev) => [session, ...prev]);

      if (isLocalAction && syncState.role !== 'SOLO') {
        triggerFinish(Date.now(), currentMs, finishSplit, finalSnapshotUri);
      }
    },
    [config.distanceMeters, config.soundBeepEnabled, config.testTitle, elapsedMs, selectedAthlete, splits, syncState.role, triggerFinish]
  );

  const handleResetTimer = (isLocalAction = true) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    startTimeRef.current = null;
    setElapsedMs(0);
    setSplits([]);
    setDetectorState('ARMED');
    if (isLocalAction && syncState.role !== 'SOLO') {
      syncResetTimer();
    }
  };

  const handleSelectAthlete = (ath: Athlete) => {
    setSelectedAthlete(ath);
    if (syncState.role !== 'SOLO') {
      syncSelectAthlete(ath);
    }
  };

  const handleAddManualLap = (snapshotUri?: string) => {
    if (detectorState !== 'RUNNING') return;

    const currentMs = elapsedMs;
    const prevMs = splits[splits.length - 1]?.elapsedMs || 0;
    const diff = currentMs - prevMs;

    if (config.soundBeepEnabled) {
      playBeep(1400, 100);
    }

    const lap: LapSplit = {
      id: `split-${Date.now()}`,
      splitIndex: splits.length + 1,
      label: `Split ${splits.length + 1}`,
      timestampMs: performance.now(),
      elapsedMs: currentMs,
      diffFromPrevMs: diff,
      capturedImageUri: snapshotUri,
    };

    setSplits((prev) => [...prev, lap]);
  };

  // Motion engine callback
  const handleMotionTriggered = useCallback(
    (result: MotionAnalysisResult) => {
      if (syncState.role === 'START') {
        // Device 1 (Start Gate) -> Motion triggers START!
        if (detectorState === 'ARMED' || detectorState === 'IDLE') {
          startTimer(true);
        }
      } else if (syncState.role === 'FINISH') {
        // Device 2 (Finish Gate) -> Motion triggers FINISH when running!
        if (detectorState === 'RUNNING') {
          handleStopTimer(result.snapshotUri, true);
        }
      } else if (syncState.role === 'SOLO') {
        // Solo mode: Start if ARMED, Finish if RUNNING
        if (detectorState === 'ARMED') {
          startTimer(true);
        } else if (detectorState === 'RUNNING') {
          handleStopTimer(result.snapshotUri, true);
        }
      }
    },
    [detectorState, handleStopTimer, startTimer, syncState.role]
  );

  const handleAddAthlete = (newAthleteData: Omit<Athlete, 'id'>) => {
    const newAthlete: Athlete = {
      ...newAthleteData,
      id: `ath-${Date.now()}`,
    };
    setAthletes((prev) => [...prev, newAthlete]);
    handleSelectAthlete(newAthlete);
  };

  const handleDeleteAthlete = (id: string) => {
    setAthletes((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (selectedAthlete.id === id && filtered.length > 0) {
        handleSelectAthlete(filtered[0]);
      }
      return filtered;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* App Header Bar */}
      <Header
        selectedAthlete={selectedAthlete}
        athletes={athletes}
        onSelectAthlete={handleSelectAthlete}
        detectorState={detectorState}
        testTitle={config.testTitle}
        categoryLabel={config.categoryLabel}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAthletes={() => setIsAthleteModalOpen(true)}
        syncState={syncState}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Main Grid Workspace */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Top Section: Camera & Motion Detector + Live Stopwatch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Camera Viewport (Left / Top) */}
          <div className="lg:col-span-7">
            <CameraDetectorView
              config={config}
              onUpdateConfig={(up) => setConfig((prev) => ({ ...prev, ...up }))}
              detectorState={detectorState}
              onMotionTriggered={handleMotionTriggered}
              isDemoMode={isDemoMode}
              selectedAthleteName={selectedAthlete.name}
              onArmDetector={handleArmDetector}
              onResetTimer={() => handleResetTimer(true)}
              elapsedMs={elapsedMs}
              onStartTimer={() => startTimer(true)}
              onStopTimer={() => handleStopTimer(undefined, true)}
              syncState={syncState}
            />
          </div>

          {/* Timer Display & Controls (Right / Top) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <TimerDisplay
              elapsedMs={elapsedMs}
              detectorState={detectorState}
              config={config}
              onUpdateConfig={(up) => setConfig((prev) => ({ ...prev, ...up }))}
              onStart={() => startTimer(true)}
              onStop={() => handleStopTimer(undefined, true)}
              onReset={() => handleResetTimer(true)}
              onArmDetector={handleArmDetector}
              onAddManualLap={() => handleAddManualLap()}
            />
          </div>
        </div>

        {/* Lower Section: Split Logs & Photo Finish List */}
        <div className="grid grid-cols-1 gap-4">
          <SplitLogsPanel
            splits={splits}
            athlete={selectedAthlete}
            onClearSplits={() => setSplits([])}
            onDeleteSplit={(id) => setSplits((prev) => prev.filter((s) => s.id !== id))}
          />
        </div>

        {/* Sprint Leaderboard & Export */}
        <HistoryLeaderboard
          sessions={historySessions}
          onClearHistory={() => setHistorySessions([])}
        />
      </main>

      {/* Modals */}
      <AthleteManagerModal
        isOpen={isAthleteModalOpen}
        onClose={() => setIsAthleteModalOpen(false)}
        athletes={athletes}
        selectedAthleteId={selectedAthlete.id}
        onSelectAthlete={handleSelectAthlete}
        onAddAthlete={handleAddAthlete}
        onDeleteAthlete={handleDeleteAthlete}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onUpdateConfig={(up) => setConfig((prev) => ({ ...prev, ...up }))}
      />

      <MultiDeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncState={syncState}
        onChangeRoomAndRole={changeRoomAndRole}
      />
    </div>
  );
}
