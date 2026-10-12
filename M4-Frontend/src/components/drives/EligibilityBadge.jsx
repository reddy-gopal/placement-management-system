import { CheckCircle2, XCircle, Info, ChevronRight } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip.jsx';

export const EligibilityBadge = ({
  isEligible,
  reasons = [],
  student,
  drive,
  size = 'md',
  onShowBreakdown,
}) => {
  const hasReasons = reasons && reasons.length > 0;

  const tooltipContent = (
    <div className="space-y-2 py-0.5">
      <div className="flex items-center gap-1.5 border-b border-slate-700/60 pb-1.5">
        {isEligible ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-300 text-xs">
              Eligible for this Drive
            </span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-rose-300 text-xs">
              Ineligibility Reasons
            </span>
          </>
        )}
      </div>

      {isEligible ? (
        <div className="text-slate-300 text-xs leading-relaxed">
          Great news! Your qualifications meet all recruitment criteria set by the employer.
        </div>
      ) : (
        <ul className="space-y-1.5 text-xs text-rose-200/90 list-disc list-inside">
          {reasons.map((reason, idx) => (
            <li key={idx} className="leading-snug">
              <span className="text-slate-100">{reason}</span>
            </li>
          ))}
        </ul>
      )}

      {student && (
        <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
          <span>Your CGPA: <strong className="text-slate-200">{student.cgpa ?? 'N/A'}</strong></span>
          <span>Branch: <strong className="text-slate-200">{student.branch ?? 'N/A'}</strong></span>
          <span>Backlogs: <strong className="text-slate-200">{student.activeBacklogs ?? 0}</strong></span>
        </div>
      )}

      {onShowBreakdown && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowBreakdown();
          }}
          className="w-full mt-1 pt-1.5 text-indigo-400 hover:text-indigo-300 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <span>View Detailed Breakdown</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-2',
    lg: 'text-sm px-4 py-2 gap-2',
  };

  if (isEligible) {
    return (
      <Tooltip content={tooltipContent} position="top">
        <span
          className={`inline-flex items-center font-semibold rounded-full border shadow-sm transition-all duration-200 cursor-help bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Eligible to Apply</span>
          <Info className="w-3 h-3 text-emerald-400/70 ml-0.5" />
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={tooltipContent} position="top">
      <span
        className={`inline-flex items-center font-semibold rounded-full border shadow-sm transition-all duration-200 cursor-help bg-rose-500/15 text-rose-400 border-rose-500/40 hover:bg-rose-500/25 ${sizeClasses[size]}`}
      >
        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <span>Not Eligible</span>
        <span className="text-[11px] px-1.5 py-0.2 bg-rose-500/30 rounded-full font-mono text-rose-200">
          {reasons.length} {reasons.length === 1 ? 'issue' : 'issues'}
        </span>
        <Info className="w-3 h-3 text-rose-400/70 ml-0.5" />
      </span>
    </Tooltip>
  );
};
