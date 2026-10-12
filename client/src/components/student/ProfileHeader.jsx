import { getDisplayInitials } from '../../utils/profileInsights';

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** 48px completeness ring: black arc on a hairline track, lime dot marking the end. */
function CompletenessRing({ percent }) {
  const arc = (CIRCUMFERENCE * percent) / 100;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="#E7E7EB" strokeWidth="5" />
      {percent > 0 && (
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="#111"
          strokeWidth="5"
          strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
          transform="rotate(-90 24 24)"
        />
      )}
      {percent > 0 && (
        <circle cx="24" cy="4" r="3" fill="#C6FF00" stroke="#111" strokeWidth="1" transform={`rotate(${percent * 3.6} 24 24)`} />
      )}
    </svg>
  );
}

/** Avatar, name and account line, with the profile-completeness summary on the right. */
export default function ProfileHeader({ profile, user, completeness, onJumpToField }) {
  const { items, percent } = completeness;
  const nextItem = items.find((item) => !item.done);
  const name = user?.name || profile?.rollNumber || 'My profile';
  const subtitle = [user?.email, user?.role ?? (profile ? 'STUDENT' : null)].filter(Boolean).join(' · ');
  const nextLabel = nextItem ? `${nextItem.action.charAt(0).toUpperCase()}${nextItem.action.slice(1)}` : '';

  return (
    <section className="flex flex-wrap items-center justify-between gap-6">
      <div className="flex min-w-0 items-center gap-5">
        <span
          aria-hidden="true"
          className="grid h-18 w-18 shrink-0 place-items-center rounded-full bg-ink text-2xl font-semibold text-white"
        >
          {getDisplayInitials({ name: user?.name, rollNumber: profile?.rollNumber })}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-semibold tracking-[-0.03em] text-ink">{name}</h1>
          {subtitle && <p className="mt-1 truncate text-sm text-muted">{subtitle}</p>}
        </div>
      </div>

      <div
        role="group"
        aria-label="Profile completeness"
        className="flex items-center gap-4 rounded-lg border border-line px-4.5 py-3.5"
      >
        <CompletenessRing percent={percent} />
        <div>
          <p className="text-lg font-semibold text-ink">{percent}% complete</p>
          {nextItem ? (
            <button
              type="button"
              onClick={() => onJumpToField(nextItem.field)}
              className="mt-0.5 text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              {nextLabel} →
            </button>
          ) : (
            <p className="mt-0.5 text-xs text-muted">Ready for placement drives</p>
          )}
        </div>
      </div>
    </section>
  );
}
