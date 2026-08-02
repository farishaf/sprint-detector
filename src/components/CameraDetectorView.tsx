import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Sliders, Play, AlertCircle, Eye, Gauge, ChevronLeft, ChevronRight, Smartphone, Monitor, Target, Zap, Square, RotateCcw, Timer as TimerIcon, Radio, Flag, PlayCircle, Tv } from 'lucide-react';
import { DetectionConfig, DetectorState, MultiDeviceSyncState } from '../types';
import { DemoRunnerSimulator } from '../utils/demoSimulation';
import { MotionAnalysisResult, OpticalMotionEngine } from '../utils/motionEngine';

interface CameraDetectorViewProps {
  config: DetectionConfig;
  onUpdateConfig: (updated: Partial<DetectionConfig>) => void;
  detectorState: DetectorState;
  onMotionTriggered: (result: MotionAnalysisResult) => void;
  isDemoMode: boolean;
  selectedAthleteName: string;
  onArmDetector?: () => void;
  onResetTimer?: () => void;
  elapsedMs?: number;
  onStartTimer?: () => void;
  onStopTimer?: () => void;
  syncState?: MultiDeviceSyncState;
}

export const CameraDetectorView: React.FC<CameraDetectorViewProps> = ({
  config,
  onUpdateConfig,
  detectorState,
  onMotionTriggered,
  isDemoMode,
  selectedAthleteName,
  onArmDetector,
  onResetTimer,
  elapsedMs = 0,
  onStartTimer,
  onStopTimer,
  syncState,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const demoSimRef = useRef<DemoRunnerSimulator | null>(null);
  const engineRef = useRef<OpticalMotionEngine | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [currentMotionPercent, setCurrentMotionPercent] = useState<number>(0);
  const [isLineTriggered, setIsLineTriggered] = useState<boolean>(false);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [isDraggingLine, setIsDraggingLine] = useState<boolean>(false);
  const [mobileAspectRatio, setMobileAspectRatio] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');

  // Initialize Motion Engine
  useEffect(() => {
    engineRef.current = new OpticalMotionEngine();
    return () => {
      engineRef.current?.reset();
    };
  }, []);

  // Initialize Demo Simulator if in demo mode
  useEffect(() => {
    if (isDemoMode) {
      if (!demoSimRef.current) {
        demoSimRef.current = new DemoRunnerSimulator(640, 480);
      }
      demoSimRef.current.drawScene();
    }
  }, [isDemoMode]);

  // Request & Start Real Camera Stream when not in Demo Mode
  useEffect(() => {
    if (isDemoMode) return;

    let currentStream: MediaStream | null = null;
    let isCancelled = false;

    async function startCamera() {
      setCameraError(null);

      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setHasCameraPermission(false);
        setCameraError(
          `Kamera hanya bisa diakses lewat HTTPS (atau http://localhost). Anda membuka lewat "${window.location.origin}" yang tidak aman. Gunakan http://localhost:3000 di komputer ini, atau HTTPS setelah deploy ke VPS.`
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setHasCameraPermission(true);
      } catch (err: unknown) {
        if (isCancelled) return;
        console.warn('Camera access error:', err);
        setHasCameraPermission(false);
        setCameraError(
          err instanceof Error
            ? err.message
            : 'Gagal mengakses kamera. Silakan periksa izin kamera atau gunakan Mode Simulasi Demo.'
        );
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, isDemoMode]);

  // Main Detection Loop (runs at ~30 FPS)
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const now = performance.now();
      let source: HTMLVideoElement | HTMLCanvasElement | null = null;

      if (isDemoMode && demoSimRef.current) {
        source = demoSimRef.current.getCanvas();
      } else if (videoRef.current && videoRef.current.readyState >= 2) {
        source = videoRef.current;
      }

      if (source && engineRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Sync size
          const sw = (source as HTMLVideoElement).videoWidth || source.width || 640;
          const sh = (source as HTMLVideoElement).videoHeight || source.height || 480;

          if (canvas.width !== sw || canvas.height !== sh) {
            canvas.width = sw;
            canvas.height = sh;
          }

          // Draw video/sim frame to overlay canvas
          ctx.drawImage(source, 0, 0, sw, sh);

          // Perform Motion Analysis
          const result = engineRef.current.analyzeFrame(source, config, now);
          setCurrentMotionPercent(result.motionPercent);

          // Draw Trigger Line Overlay (Green when idle, Red/Glowing when triggered)
          const linePosPx = (config.linePosition / 100) * sw;
          const triggered = result.triggered;

          if (triggered) {
            setIsLineTriggered(true);
            setTimeout(() => setIsLineTriggered(false), 800);
            onMotionTriggered(result);
          }

          ctx.save();
          // Draw detection boundary shade
          ctx.fillStyle = triggered ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.08)';
          ctx.fillRect(linePosPx - 10, 0, 20, sh);

          // Main vertical detection line (Reference image exact match: green vertical finish line box)
          ctx.strokeStyle = triggered ? '#ef4444' : '#22c55e';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(linePosPx, 0);
          ctx.lineTo(linePosPx, sh);
          ctx.stroke();

          // Dotted guide center
          ctx.setLineDash([8, 6]);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);

          // Line marker handles on top & bottom
          ctx.fillStyle = triggered ? '#ef4444' : '#22c55e';
          ctx.beginPath();
          ctx.arc(linePosPx, 16, 10, 0, Math.PI * 2);
          ctx.arc(linePosPx, sh - 16, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          const lineLabel = syncState?.role === 'START' ? 'START' : 'FINISH';
          ctx.fillText(lineLabel, linePosPx, 20);
          ctx.fillText('LINE', linePosPx, sh - 12);

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [config, isDemoMode, onMotionTriggered]);

  // Helper to process position from event (Mouse & Touch)
  const updateLinePositionFromCoords = (clientX: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newPos = Math.round((x / rect.width) * 100);
    onUpdateConfig({ linePosition: Math.max(5, Math.min(95, newPos)) });
  };

  // Mouse handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    updateLinePositionFromCoords(e.clientX);
    setIsDraggingLine(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingLine) return;
    updateLinePositionFromCoords(e.clientX);
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingLine(false);
  };

  // Touch handlers for mobile phone screens
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      updateLinePositionFromCoords(e.touches[0].clientX);
      setIsDraggingLine(true);
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingLine || e.touches.length === 0) return;
    updateLinePositionFromCoords(e.touches[0].clientX);
  };

  const handleCanvasTouchEnd = () => {
    setIsDraggingLine(false);
  };

  const handleNudgeLine = (deltaPercent: number) => {
    const current = config.linePosition;
    const updated = Math.max(5, Math.min(95, current + deltaPercent));
    onUpdateConfig({ linePosition: updated });
  };

  const handleTriggerDemoRunner = () => {
    if (demoSimRef.current) {
      demoSimRef.current.startRun(0.24, selectedAthleteName);
    }
  };

  return (
    <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* Hidden element for camera feed processing */}
      {!isDemoMode && (
        <video
          ref={videoRef}
          playsInline
          muted
          className="hidden"
        />
      )}

      {/* Main Viewport Container with responsive aspect ratio */}
      <div className={`relative w-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 transition-all ${
        mobileAspectRatio === 'PORTRAIT' ? 'aspect-[3/4]' : 'aspect-[4/3]'
      } ${
        isLineTriggered
          ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
          : detectorState === 'ARMED'
          ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
          : 'border-slate-800'
      }`}>
        {/* Render Canvas supporting both touch & click */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          className="w-full h-full object-cover cursor-col-resize select-none touch-none"
        />

        {/* Camera Error Fallback Banner */}
        {!isDemoMode && cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertCircle className="w-12 h-12 text-amber-400 mb-3 animate-bounce" />
            <h3 className="text-white font-bold text-base mb-1">Akses Kamera Diperlukan</h3>
            <p className="text-slate-400 text-xs max-w-xs mb-4">{cameraError}</p>
            <button
              onClick={() => onUpdateConfig({ linePosition: 50 })}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 min-h-[44px]"
            >
              <Eye className="w-4 h-4" />
              Ganti ke Mode Simulasi Demo
            </button>
          </div>
        )}

        {/* Top-Left Overlay: Detector Button + Multi-Device Role Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <button
            onClick={onArmDetector}
            disabled={detectorState === 'RUNNING'}
            className={`px-3 py-2 rounded-xl backdrop-blur-md border flex items-center gap-2 text-xs font-bold transition-all shadow-xl min-h-[44px] ${
              detectorState === 'ARMED'
                ? 'bg-emerald-500/95 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/60 shadow-emerald-900/30'
                : detectorState === 'RUNNING'
                ? 'bg-amber-500/95 text-slate-950 border-amber-300 cursor-not-allowed'
                : 'bg-indigo-600/90 hover:bg-indigo-500 text-white border-indigo-400 hover:scale-105 active:scale-95 shadow-indigo-950/50'
            }`}
            title="Klik untuk Mengaktifkan Detektor Garis Motion Sensor"
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              detectorState === 'ARMED' ? 'bg-slate-950 animate-ping' :
              detectorState === 'RUNNING' ? 'bg-slate-950 animate-pulse' :
              'bg-amber-300 animate-pulse'
            }`} />
            <Target className="w-4 h-4 shrink-0" />
            <span className="text-[11px] sm:text-xs tracking-wide">
              {detectorState === 'ARMED' ? 'Garis SIAP' :
               detectorState === 'RUNNING' ? 'Deteksi...' :
               'Aktifkan Garis'}
            </span>
          </button>

          {/* Active Device Role Badge */}
          {syncState && syncState.role !== 'SOLO' && (
            <div className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border flex items-center gap-1.5 text-xs font-bold shadow-lg text-white ${
              syncState.role === 'START'
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                : syncState.role === 'FINISH'
                ? 'bg-indigo-950/80 border-indigo-500/80 text-indigo-300'
                : 'bg-purple-950/80 border-purple-500/80 text-purple-300'
            }`}>
              {syncState.role === 'START' && <PlayCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
              {syncState.role === 'FINISH' && <Flag className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
              {syncState.role === 'MONITOR' && <Tv className="w-3.5 h-3.5 text-purple-400" />}
              <span className="text-[10px] uppercase font-extrabold">
                {syncState.role === 'START' && 'Device 1 (Start)'}
                {syncState.role === 'FINISH' && 'Device 2 (Finish)'}
                {syncState.role === 'MONITOR' && 'Monitor Display'}
              </span>
            </div>
          )}
        </div>



        {/* Compact Sprint Timer Overlay Badge at Bottom-Right Corner */}
        <div className="absolute bottom-14 right-3 z-10 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1.5 text-white">
          <TimerIcon className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase font-bold text-slate-400">Timer:</span>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-400 tracking-tight">
            {(elapsedMs / 1000).toFixed(2)}s
          </span>
        </div>

        {/* Realtime Motion Sensitivity Bar overlay bottom-left */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5 text-white text-xs z-10">
          <div className="flex items-center gap-1 shrink-0 text-slate-300 font-medium">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Sinyal:</span>
          </div>

          {/* Progress bar */}
          <div className="relative flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            {/* Threshold marker line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${config.sensitivity}%` }}
              title={`Pemicu: ${config.sensitivity}%`}
            />
            {/* Motion level fill */}
            <div
              className={`h-full transition-all duration-75 ${
                currentMotionPercent >= config.sensitivity ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, currentMotionPercent * 2)}%` }}
            />
          </div>

          <span className="font-mono text-xs font-bold shrink-0 w-8 text-right">
            {currentMotionPercent}%
          </span>
        </div>

        {/* Top-right overlay buttons with 44px min touch target */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {/* Mobile Aspect Ratio Switcher */}
          <button
            onClick={() => setMobileAspectRatio((prev) => (prev === 'LANDSCAPE' ? 'PORTRAIT' : 'LANDSCAPE'))}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md shadow-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={mobileAspectRatio === 'LANDSCAPE' ? 'Mode Kamera HP Tegak (Potret)' : 'Mode Kamera Mendatar (Lansekap)'}
          >
            {mobileAspectRatio === 'LANDSCAPE' ? (
              <Smartphone className="w-4 h-4 text-indigo-400" />
            ) : (
              <Monitor className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {!isDemoMode && (
            <button
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md shadow-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Ganti Kamera Depan/Belakang"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`p-2.5 rounded-xl border backdrop-blur-md shadow-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
              showConfigPanel
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
            title="Pengaturan Posisi Garis Deteksi"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Control Strip with Mobile Quick-Nudge Buttons (-5% / +5%) */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Action Buttons: Arm Line Detector & Demo trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {onArmDetector && (
            <button
              onClick={onArmDetector}
              disabled={detectorState === 'RUNNING'}
              className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 min-h-[44px] ${
                detectorState === 'ARMED'
                  ? 'bg-emerald-500 text-slate-950 border border-emerald-400'
                  : detectorState === 'RUNNING'
                  ? 'bg-amber-500 text-slate-950 border border-amber-400 opacity-80 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>
                {detectorState === 'ARMED' ? 'Garis SIAP (ARMED)' :
                 detectorState === 'RUNNING' ? 'Mendeteksi Lari...' :
                 'Aktifkan Detektor Garis'}
              </span>
            </button>
          )}

          {isDemoMode && (
            <button
              onClick={handleTriggerDemoRunner}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Simulasi Lari</span>
            </button>
          )}
        </div>

        {/* Mobile Friendly Line Adjustment: Nudge Buttons + Slider */}
        <div className="flex items-center gap-1.5 flex-1 max-w-sm justify-end">
          <button
            onClick={() => handleNudgeLine(-5)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-slate-200 border border-slate-700 font-bold min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
            title="Geser Garis Ke Kiri 5%"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="10"
            max="90"
            value={config.linePosition}
            onChange={(e) => onUpdateConfig({ linePosition: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <button
            onClick={() => handleNudgeLine(5)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-slate-200 border border-slate-700 font-bold min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
            title="Geser Garis Ke Kanan 5%"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="font-mono text-slate-300 font-semibold w-9 text-right text-[11px] shrink-0">
            {config.linePosition}%
          </span>
        </div>
      </div>

      {/* Expanded Adjustments Panel */}
      {showConfigPanel && (
        <div className="p-4 bg-slate-900/95 border-t border-slate-800 space-y-3">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Pengaturan Sensitivitas Deteksi Garis
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1">
                Sensitivitas Ambang Pemicu ({config.sensitivity}%)
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={config.sensitivity}
                onChange={(e) => onUpdateConfig({ sensitivity: Number(e.target.value) })}
                className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Makin kecil persentase, makin sensitif terhadap gerakan kecil.
              </p>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1">
                Orientasi Garis Deteksi
              </label>
              <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700">
                <button
                  onClick={() => onUpdateConfig({ lineOrientation: 'VERTICAL' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors min-h-[38px] ${
                    config.lineOrientation === 'VERTICAL'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Vertikal (Finish Line)
                </button>
                <button
                  onClick={() => onUpdateConfig({ lineOrientation: 'HORIZONTAL' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors min-h-[38px] ${
                    config.lineOrientation === 'HORIZONTAL'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Horisontal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
