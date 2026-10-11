import { CheckCircle2, MinusCircle, Pencil, UserRound } from 'lucide-react';
import { buttonClassName } from '../ui/buttonStyles';
import { cardClassName, chip, eyebrowClassName } from '../ui/cardStyles';
import { getInitials } from '../../utils/profileInsights';

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
      <dt className={eyebrowClassName}>{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

/**
 * Compact read-only summary of a student's saved profile.
 * Reusable on the student dashboard; pass `onEdit` to show the Edit button.
 */
export default function StudentProfileSummary({ profile, onEdit, className = '' }) {
  const card = `${cardClassName} p-5 ${className}`;

  if (!profile) {
    return (
      <section aria-labelledby="profile-summary-title" className={card}>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            <UserRound className="h-5 w-5" />
          </span>
          <h2 id="profile-summary-title" className="font-semibold text-slate-900 dark:text-slate-100">
            Student Profile
          </h2>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          You haven't created your profile yet. Complete it to start applying to placement drives.
        </p>
        {onEdit && (
          <button type="button" onClick={onEdit} className={`${buttonClassName.primary} mt-5 w-full`}>
            Create Profile
          </button>
        )}
      </section>
    );
  }

  const hasResume = Boolean(profile.resumeUrl);

  return (
    <section aria-labelledby="profile-summary-title" className={card}>
      <div className="flex items-start justify-between gap-3">
        <h2 id="profile-summary-title" className={eyebrowClassName}>
          Student Profile
        </h2>
        {profile.isPlaced && <span className={chip('success')}>Placed</span>}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-semibold text-white shadow-sm"
        >
          {getInitials(profile.rollNumber)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {profile.rollNumber}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {profile.branch} • {profile.graduationYear}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="CGPA" value={profile.cgpa} />
        <Stat label="Backlogs" value={profile.activeBacklogs} />
      </dl>

      <div className="mt-5">
        <h3 className={eyebrowClassName}>Skills</h3>
        {profile.skills?.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600/40"
              >
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No skills added</p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <h3 className={eyebrowClassName}>Resume</h3>
        {hasResume ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Available
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <MinusCircle className="h-4 w-4" aria-hidden="true" /> Not added
          </p>
        )}
      </div>

      {onEdit && (
        <button type="button" onClick={onEdit} className={`${buttonClassName.secondary} mt-5 w-full`}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit Profile
        </button>
      )}
    </section>
  );
}
