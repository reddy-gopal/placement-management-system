import { buttonClassName } from '../ui/buttonStyles';
import { cardClassName, chip, eyebrowClassName } from '../ui/cardStyles';
import { getInitials } from '../../utils/profileInsights';

function Stat({ label, value, last = false }) {
  return (
    <div className={`px-4 py-3 ${last ? '' : 'border-r border-line'}`}>
      <dt className={eyebrowClassName}>{label}</dt>
      <dd className="mt-1.5 text-xl font-semibold tracking-[-0.02em] text-ink">{value}</dd>
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
        <h2 id="profile-summary-title" className="text-base font-semibold text-ink">
          Student Profile
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
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

      <div className="mt-4 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white"
        >
          {getInitials(profile.rollNumber)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-mono text-base font-medium text-ink">{profile.rollNumber}</p>
          <p className="text-[13px] text-muted">
            {profile.branch} • {profile.graduationYear}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 rounded-lg border border-line">
        <Stat label="CGPA" value={profile.cgpa} />
        <Stat label="Backlogs" value={profile.activeBacklogs} last />
      </dl>

      <div className="mt-5">
        <h3 className={eyebrowClassName}>Skills</h3>
        {profile.skills?.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <li key={skill} className="rounded border border-line px-2 py-0.5 text-xs text-ink">
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted">No skills added</p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <h3 className={eyebrowClassName}>Resume</h3>
        <span className={chip(hasResume ? 'success' : 'neutral')}>{hasResume ? 'Available' : 'Not added'}</span>
      </div>

      {onEdit && (
        <button type="button" onClick={onEdit} className={`${buttonClassName.secondary} mt-5 w-full`}>
          Edit Profile
        </button>
      )}
    </section>
  );
}
