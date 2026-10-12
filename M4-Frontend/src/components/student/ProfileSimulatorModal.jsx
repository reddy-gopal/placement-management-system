import { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  UserCheck,
  Key,
  GraduationCap,
  AlertOctagon,
  BookOpen,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useStudent } from '../../context/StudentContext.jsx';
import { Button } from '../ui/Button.jsx';
import { BRANCH_OPTIONS } from '../drives/DriveFilters.jsx';

export const ProfileSimulatorModal = ({ isOpen, onClose }) => {
  const {
    student,
    presets,
    activePresetId,
    selectPreset,
    updateCustomStudent,
    token,
    loginWithToken,
    logout,
  } = useStudent();

  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom' | 'token'
  const [customBranch, setCustomBranch] = useState(student?.branch || 'CSE');
  const [customCgpa, setCustomCgpa] = useState(Number(student?.cgpa || 7.5));
  const [customBacklogs, setCustomBacklogs] = useState(Number(student?.activeBacklogs || 0));
  const [customName, setCustomName] = useState(student?.name || 'Custom Student');
  const [tokenInput, setTokenInput] = useState(token || '');

  if (!isOpen) return null;

  const handleApplyCustom = () => {
    updateCustomStudent({
      name: customName,
      branch: customBranch,
      cgpa: Number(customCgpa),
      activeBacklogs: Number(customBacklogs),
      isSimulated: true,
    });
    onClose();
  };

  const handleApplyToken = () => {
    if (tokenInput.trim()) {
      loginWithToken(tokenInput.trim());
    } else {
      logout();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7 z-10 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Eligibility Engine Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Test how real-time eligibility badges respond to different student academic profiles.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quick Archetypes
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'custom'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Adjuster
          </button>
          <button
            onClick={() => setActiveTab('token')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'token'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live JWT Token
          </button>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="mt-4 space-y-2.5">
            {presets.map((p) => {
              const isSelected = activePresetId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    selectPreset(p.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                      {p.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {p.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {p.branch}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        CGPA: <strong className="text-emerald-400">{p.cgpa}</strong> • Backlogs:{' '}
                        <strong className={p.activeBacklogs > 0 ? 'text-amber-400' : 'text-slate-200'}>
                          {p.activeBacklogs}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        p.tagColor === 'emerald'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : p.tagColor === 'amber'
                          ? 'bg-amber-500/15 text-amber-300'
                          : p.tagColor === 'rose'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-indigo-500/15 text-indigo-300'
                      }`}
                    >
                      {p.tag}
                    </span>
                    {isSelected && (
                      <span className="flex items-center justify-end gap-1 text-[11px] text-indigo-400 font-semibold mt-1">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Custom Sliders */}
        {activeTab === 'custom' && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Candidate Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Academic Branch
                </label>
                <select
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {BRANCH_OPTIONS.filter((b) => b !== 'ALL').map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Active Backlogs ({customBacklogs})
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={customBacklogs}
                  onChange={(e) => setCustomBacklogs(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Cumulative CGPA</span>
                <span className="text-indigo-400 font-bold text-sm">
                  {Number(customCgpa).toFixed(1)} / 10.0
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="10.0"
                step="0.1"
                value={customCgpa}
                onChange={(e) => setCustomCgpa(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.0</span>
                <span>5.0</span>
                <span>7.5</span>
                <span>10.0</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleApplyCustom}
            >
              Apply Custom Profile to Catalog
            </Button>
          </div>
        )}

        {/* Tab 3: Live JWT Token */}
        {activeTab === 'token' && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              If the backend server (`http://localhost:4000`) is running, paste your student JWT token from Member 1 authentication to fetch real drives and student records.
            </p>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Bearer JWT Token
              </label>
              <textarea
                rows={3}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleApplyToken}
              >
                Save Token & Connect Live
              </Button>
              {token && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    logout();
                    setTokenInput('');
                    onClose();
                  }}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Clear Token
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
