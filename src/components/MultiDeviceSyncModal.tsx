import React, { useState } from 'react';
import {
  X,
  Radio,
  Flag,
  PlayCircle,
  Copy,
  Check,
  Smartphone,
  Tv,
  Sparkles,
  Link,
  Zap,
} from 'lucide-react';
import { DeviceRole, MultiDeviceSyncState } from '../types';

interface MultiDeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: MultiDeviceSyncState;
  onChangeRoomAndRole: (roomId: string, role: DeviceRole) => void;
}

export const MultiDeviceSyncModal: React.FC<MultiDeviceSyncModalProps> = ({
  isOpen,
  onClose,
  syncState,
  onChangeRoomAndRole,
}) => {
  const [pinCode, setPinCode] = useState(() => {
    // Extract numbers or default to 6-digit code
    const digits = syncState.roomId.replace(/\D/g, '');
    return digits.length >= 4 ? digits : Math.floor(100000 + Math.random() * 900000).toString();
  });

  const [selectedRole, setSelectedRole] = useState<DeviceRole>(syncState.role);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  if (!isOpen) return null;

  // Generate new 6-digit code
  const handleGeneratePin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPinCode(newPin);
  };

  // Quick setup Kamera 1 (Start)
  const handleSetupCamera1Start = () => {
    const cleanPin = pinCode.trim() || '123456';
    setSelectedRole('START');
    onChangeRoomAndRole(`GATE-${cleanPin}`, 'START');
  };

  // Quick setup Kamera 2 (Finish)
  const handleSetupCamera2Finish = () => {
    const cleanPin = pinCode.trim() || '123456';
    setSelectedRole('FINISH');
    onChangeRoomAndRole(`GATE-${cleanPin}`, 'FINISH');
  };

  // Apply general settings
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinCode.trim() || '123456';
    const finalRoomId = cleanPin.startsWith('GATE-') ? cleanPin : `GATE-${cleanPin}`;
    onChangeRoomAndRole(finalRoomId, selectedRole);
    onClose();
  };

  // Copy Direct Link for Camera 2
  const copyCamera2Link = () => {
    const cleanPin = pinCode.trim() || '123456';
    const finalRoom = cleanPin.startsWith('GATE-') ? cleanPin : `GATE-${cleanPin}`;
    const url = new URL(window.location.href);
    url.searchParams.set('room', finalRoom);
    url.searchParams.set('role', 'FINISH');
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyPinOnly = () => {
    navigator.clipboard.writeText(pinCode.trim());
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Koneksi Kode Kamera 1 &amp; 2
                {syncState.isConnected ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Terhubung
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Terputus
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Hubungkan Kamera 1 (Start) &amp; Kamera 2 (Finish) dengan Kode Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6-DIGIT CODE SECTION */}
        <div className="space-y-4 text-xs">
          <div className="bg-slate-950/90 p-4 rounded-xl border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Kode Sync Multi-Device (6 Digit)
              </label>
              <button
                type="button"
                onClick={handleGeneratePin}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline"
              >
                Buat Kode Acak
              </button>
            </div>

            {/* Display / Input PIN */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={pinCode}
                maxLength={8}
                onChange={(e) => setPinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="123456"
                className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-xl px-3 py-2.5 text-center text-white font-mono font-black text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={copyPinOnly}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors shrink-0"
                title="Salin Kode PIN"
              >
                {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Masukkan kode ini pada <strong>Kamera 1</strong> dan <strong>Kamera 2</strong> agar keduanya otomatis saling terhubung via cloud realtime.
            </p>
          </div>

          {/* Quick Action Buttons for Camera 1 & Camera 2 */}
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
              Pilih Peran HP Ini:
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* Button 1: Kamera 1 (Start) */}
              <button
                type="button"
                onClick={handleSetupCamera1Start}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'START' && syncState.roomId.includes(pinCode)
                    ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-xs flex items-center gap-1.5 text-emerald-400">
                    <PlayCircle className="w-4 h-4" />
                    Kamera 1 (Start)
                  </span>
                  {selectedRole === 'START' && syncState.roomId.includes(pinCode) && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Letakkan di Garis Start untuk mendeteksi pemicu awal.
                </p>
              </button>

              {/* Button 2: Kamera 2 (Finish) */}
              <button
                type="button"
                onClick={handleSetupCamera2Finish}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'FINISH' && syncState.roomId.includes(pinCode)
                    ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 hover:border-indigo-500/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-xs flex items-center gap-1.5 text-indigo-400">
                    <Flag className="w-4 h-4" />
                    Kamera 2 (Finish)
                  </span>
                  {selectedRole === 'FINISH' && syncState.roomId.includes(pinCode) && (
                    <Check className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Letakkan di Garis Finish untuk menghentikan waktu presisi.
                </p>
              </button>
            </div>

            {/* Other Roles: Monitor or Solo */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const cleanPin = pinCode.trim() || '123456';
                  setSelectedRole('MONITOR');
                  onChangeRoomAndRole(`GATE-${cleanPin}`, 'MONITOR');
                }}
                className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                  selectedRole === 'MONITOR'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Tv className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-[11px] font-bold">Layar Monitor Penonton</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('SOLO');
                  onChangeRoomAndRole('SOLO', 'SOLO');
                }}
                className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                  selectedRole === 'SOLO'
                    ? 'bg-slate-800 border-slate-600 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[11px] font-bold">Single HP (Mode Solo)</span>
              </button>
            </div>
          </div>

          {/* Direct Link Share Option */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Link className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] font-bold text-slate-300">Tautan Otomatis Kamera 2 (Finish):</span>
                <span className="block text-[9px] text-slate-400 truncate">
                  {window.location.origin}/?room=GATE-{pinCode.trim()}&role=FINISH
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={copyCamera2Link}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1 text-[11px]"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Tersalin' : 'Salin Tautan'}</span>
            </button>
          </div>

          {/* Active Status Info */}
          {syncState.isConnected && syncState.role !== 'SOLO' && (
            <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/20 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300">Status Room Kode ({syncState.roomId}):</span>
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Realtime Ready
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold pt-1">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                  <span className="block text-slate-400 text-[9px]">Kamera 1 (Start)</span>
                  <span className="text-xs">{syncState.deviceCounts.start} HP</span>
                </div>
                <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                  <span className="block text-slate-400 text-[9px]">Kamera 2 (Finish)</span>
                  <span className="text-xs">{syncState.deviceCounts.finish} HP</span>
                </div>
                <div className="p-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
                  <span className="block text-slate-400 text-[9px]">Monitor</span>
                  <span className="text-xs">{syncState.deviceCounts.monitors} HP</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <form onSubmit={handleApply} className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Simpan &amp; Hubungkan</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
