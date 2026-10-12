import { Link } from 'react-router-dom';

/** Grey strip with the completion %, a black progress bar tipped in lime, and links to what's missing. */
export default function ProfileCompletionBar({ completeness, hasProfile }) {
  const { percent, items } = completeness;
  const missing = items.filter((item) => !item.done);
  const tip = Math.min(4, percent);

  return (
    <section
      aria-label="Profile completion"
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-line bg-subtle px-4 py-3.5 sm:px-5 sm:py-4"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-semibold tracking-[-0.02em]">{percent}%</span>
        <span className="text-[13px] text-muted">profile complete</span>
      </div>
      <div
        role="progressbar"
        aria-label="Profile completion"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="flex h-1.5 min-w-40 flex-[1_1_200px] overflow-hidden rounded-[3px] bg-line"
      >
        <div className="bg-ink" style={{ width: `${percent - tip}%` }} />
        <div className="bg-lime" style={{ width: `${tip}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {hasProfile ? (
          <>
            <span className="text-muted">Missing:</span>
            {missing.slice(0, 3).map((item) => (
              <Link key={item.key} to="/student/profile" className="underline underline-offset-2 hover:text-muted">
                {item.label}
              </Link>
            ))}
            {missing.length > 3 && <span className="text-muted">+{missing.length - 3} more</span>}
          </>
        ) : (
          <Link to="/student/profile" className="underline underline-offset-2 hover:text-muted">
            Create your profile
          </Link>
        )}
      </div>
    </section>
  );
}
