import { useEffect, useState } from 'react';
import { ArrowRight, Target } from 'lucide-react';
import { buttonClassName } from '../ui/buttonStyles';
import { cardClassName, eyebrowClassName } from '../ui/cardStyles';
import { getCompletenessGuidance } from '../../utils/profileInsights';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Circular completeness meter. Animates from 0 on mount (skipped with reduced motion via CSS). */
function CompletenessRing({ percent }) {
  const [shown, setShown] = useState(0);
  const complete = percent === 100;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  return (
    <div
      role="progressbar"
      aria-label="Profile completeness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}% complete`}
      className="relative h-32 w-32 shrink-0 sm:h-40 sm:w-40"
    >
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={RADIUS} fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke={complete ? undefined : 'url(#ring-gradient)'}
          className={`transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none ${
            complete ? 'stroke-emerald-500' : ''
          }`}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - shown / 100)}
          style={{ opacity: percent === 0 ? 0 : 1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
          {percent}
          <span className="text-xl text-slate-400 dark:text-slate-500">%</span>
        </span>
        <span className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">complete</span>
      </div>
    </div>
  );
}

/** "How placement-ready am I?" — greeting, completeness ring, segmented progress and the next action. */
export default function ReadinessHero({ completeness, hasProfile, onStart, onJumpToField }) {
  const { items, completed, total, percent } = completeness;
  const nextItem = items.find((item) => !item.done);
  const guidance = getCompletenessGuidance(completeness);
  const nextLabel = nextItem ? `${nextItem.action.charAt(0).toUpperCase()}${nextItem.action.slice(1)}` : '';

  return (
    <section aria-labelledby="readiness-title" className={`${cardClassName} relative overflow-hidden`}>
      {/* The page's one gradient accent: a soft indigo wash behind the ring. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgb(99_102_241/0.16),transparent)] dark:bg-[radial-gradient(closest-side,rgb(99_102_241/0.22),transparent)]"
      />
      <div className="relative flex flex-col-reverse gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0 flex-1">
          <p className={`${eyebrowClassName} flex items-center gap-1.5`}>
            <Target className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
            Placement readiness
          </p>
          <h2 id="readiness-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            {greeting()}
            {hasProfile ? '' : ' — welcome to NexStep'}
          </h2>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-slate-600 dark:text-slate-300">{guidance}</p>

          <div className="mt-5 max-w-md">
            <div className="flex gap-1" aria-hidden="true">
              {items.map((item) => (
                <span
                  key={item.key}
                  title={item.label}
                  className={`h-1.5 flex-1 rounded-full ${
                    item.done
                      ? percent === 100
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500 dark:bg-indigo-400'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
              {completed} of {total} profile items complete
            </p>
          </div>

          {percent < 100 && (
            <div className="mt-5">
              {hasProfile && nextItem ? (
                <button type="button" onClick={() => onJumpToField(nextItem.field)} className={buttonClassName.primary}>
                  {nextLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button type="button" onClick={onStart} className={buttonClassName.primary}>
                  Start your profile
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        <CompletenessRing percent={percent} />
      </div>
    </section>
  );
}
