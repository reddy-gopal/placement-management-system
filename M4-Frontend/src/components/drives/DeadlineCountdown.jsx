import { Clock, AlertCircle } from 'lucide-react';
import { getDeadlineCountdown, formatDate } from '../../utils/formatters.js';
import { Tooltip } from '../ui/Tooltip.jsx';

export const DeadlineCountdown = ({ deadline, showExact = true }) => {
  const countdown = getDeadlineCountdown(deadline);

  let variantClass = 'bg-slate-800/80 text-slate-300 border-slate-700';
  let dotClass = 'bg-slate-400';

  if (countdown.isExpired) {
    variantClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    dotClass = 'bg-rose-500';
  } else if (countdown.isUrgent) {
    variantClass = 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse';
    dotClass = 'bg-amber-400';
  }

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-semibold text-slate-200">Application Deadline</div>
      <div className="text-slate-400 text-xs">{formatDate(deadline)}</div>
      <div className="text-xs text-amber-300/90 font-medium">
        {countdown.isExpired
          ? 'Applications are no longer accepted for this drive.'
          : countdown.isUrgent
          ? 'Hurry! Registration closing soon.'
          : 'Make sure your profile and resume link are updated.'}
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${variantClass}`}
      >
        {countdown.isExpired ? (
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
        ) : (
          <Clock className={`w-3.5 h-3.5 shrink-0 ${countdown.isUrgent ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: countdown.isUrgent ? '12s' : '0s' }} />
        )}
        <span>{countdown.text}</span>
      </div>
    </Tooltip>
  );
};
