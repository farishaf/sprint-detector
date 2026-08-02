import React, { useState } from 'react';
import { Plus, Trash2, UserCheck, Users, X } from 'lucide-react';
import { Athlete } from '../types';

interface AthleteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: Athlete[];
  selectedAthleteId: string;
  onSelectAthlete: (athlete: Athlete) => void;
  onAddAthlete: (athlete: Omit<Athlete, 'id'>) => void;
  onDeleteAthlete: (id: string) => void;
}

export const AthleteManagerModal: React.FC<AthleteManagerModalProps> = ({
  isOpen,
  onClose,
  athletes,
  selectedAthleteId,
  onSelectAthlete,
  onAddAthlete,
  onDeleteAthlete,
}) => {
  const [name, setName] = useState('');
  const [bibNumber, setBibNumber] = useState<number>(athletes.length + 1);
  const [category, setCategory] = useState('U17');
  const [team, setTeam] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddAthlete({
      name: name.trim(),
      bibNumber: Number(bibNumber) || Math.floor(Math.random() * 90) + 10,
      category,
      team: team.trim() || undefined,
    });
    setName('');
    setBibNumber(bibNumber + 1);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Kelola Daftar Atlet</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add New Athlete Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tambah Atlet Baru</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Nama Atlet (cth: Khalil)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 text-xs font-semibold text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="No. Bib"
                value={bibNumber}
                onChange={(e) => setBibNumber(Number(e.target.value))}
                className="w-full bg-slate-900 text-xs font-semibold text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-900 text-xs font-semibold text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
            >
              <option value="U15">Kategori U15</option>
              <option value="U17">Kategori U17</option>
              <option value="U20">Kategori U20</option>
              <option value="Senior">Senior / Terbuka</option>
            </select>

            <input
              type="text"
              placeholder="Tim / Klub (Opsional)"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="bg-slate-900 text-xs font-semibold text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Simpan Atlet</span>
          </button>
        </form>

        {/* List of existing athletes */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pilih Atlet Aktif:</h4>
          {athletes.map((ath) => {
            const isSelected = ath.id === selectedAthleteId;
            return (
              <div
                key={ath.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div
                  onClick={() => {
                    onSelectAthlete(ath);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 flex-1 cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {ath.bibNumber}
                  </span>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>{ath.name}</span>
                      {isSelected && <UserCheck className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {ath.category} {ath.team ? `• ${ath.team}` : ''}
                    </div>
                  </div>
                </div>

                {athletes.length > 1 && (
                  <button
                    onClick={() => onDeleteAthlete(ath.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="Hapus Atlet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
