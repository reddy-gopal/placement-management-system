import { User, Sparkles, Sliders, CheckCircle2, AlertCircle, Key } from 'lucide-react';
import { useStudent } from '../../context/StudentContext.jsx';
import { Button } from '../ui/Button.jsx';

export const StudentProfileBar = ({ onOpenSimulator }) => {
  const { student, isLiveMode, token } = useStudent();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 p-4 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Student Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
            {student?.name
              ? student.name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
              : 'ST'}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white tracking-tight">
                {student?.name || 'Student Candidate'}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-medium border border-indigo-500/30">
                {student?.rollNumber || '21CS101'}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                  isLiveMode
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {isLiveMode ? '● Live Backend Session' : '⚡ Eligibility Simulator Active'}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs text-slate-300 flex-wrap">
              <span>
                Branch: <strong className="text-white">{student?.branch || 'CSE'}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>
                CGPA: <strong className="text-emerald-400 font-bold">{Number(student?.cgpa || 0).toFixed(1)}</strong> / 10.0
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Active Backlogs:{' '}
                <strong className={Number(student?.activeBacklogs || 0) > 0 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                  {student?.activeBacklogs || 0}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Switcher Trigger */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={Sliders}
            onClick={onOpenSimulator}
            className="text-xs bg-slate-800/80 hover:bg-slate-700 border-indigo-500/30 text-indigo-300 hover:text-white"
          >
            <span>Test Eligibility Simulator</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
