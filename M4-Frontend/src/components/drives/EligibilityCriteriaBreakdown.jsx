import { CheckCircle2, XCircle, GraduationCap, AlertOctagon, BookOpen } from 'lucide-react';
import { checkStudentEligibility } from '../../utils/eligibilityEngine.js';

export const EligibilityCriteriaBreakdown = ({ drive, student }) => {
  const result = checkStudentEligibility(student, drive);
  const { breakdown } = result;

  const criteria = [
    {
      title: 'Minimum CGPA Requirement',
      icon: GraduationCap,
      required: `${breakdown.cgpa.required.toFixed(1)} / 10.0`,
      yourValue: `${Number(breakdown.cgpa.current).toFixed(1)} / 10.0`,
      satisfied: breakdown.cgpa.satisfied,
      reason: breakdown.cgpa.reason,
      percentage: Math.min(100, (breakdown.cgpa.current / 10) * 100),
      cutoffPercentage: (breakdown.cgpa.required / 10) * 100,
    },
    {
      title: 'Active Backlogs Allowance',
      icon: AlertOctagon,
      required: `Maximum ${breakdown.backlogs.allowed} backlog${breakdown.backlogs.allowed === 1 ? '' : 's'}`,
      yourValue: `${breakdown.backlogs.current} active backlog${breakdown.backlogs.current === 1 ? '' : 's'}`,
      satisfied: breakdown.backlogs.satisfied,
      reason: breakdown.backlogs.reason,
    },
    {
      title: 'Allowed Branches',
      icon: BookOpen,
      required:
        breakdown.branch.allowed && breakdown.branch.allowed.length > 0
          ? breakdown.branch.allowed.join(', ')
          : 'All Branches Allowed',
      yourValue: breakdown.branch.current || 'Not specified',
      satisfied: breakdown.branch.satisfied,
      reason: breakdown.branch.reason,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">
          Eligibility Engine Evaluation
        </h4>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            result.isEligible
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}
        >
          {result.isEligible ? 'Overall: Eligible' : 'Overall: Ineligible'}
        </span>
      </div>

      <div className="grid gap-2.5">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border transition-all ${
              item.satisfied
                ? 'bg-slate-800/40 border-slate-700/60'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    item.satisfied
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cut-off: <span className="text-slate-200 font-medium">{item.required}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {item.satisfied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-400">
                        Satisfied
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-xs font-semibold text-rose-400">
                        Not Met
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your profile: <strong className="text-slate-200">{item.yourValue}</strong>
                </p>
              </div>
            </div>

            {/* Error explanation if not met */}
            {!item.satisfied && item.reason && (
              <div className="mt-2.5 pt-2 border-t border-rose-500/20 text-xs text-rose-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{item.reason}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
