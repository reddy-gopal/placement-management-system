import ProfileSection from './ProfileSection';
import { chip } from '../ui/cardStyles';

function Cell({ label, children, last = false }) {
  return (
    <div className={`p-4 ${last ? '' : 'border-b border-line sm:border-b-0 sm:border-r'}`}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2.5 text-sm">{children}</dd>
    </div>
  );
}

/** Read-only placement outcome; set by the placement cell, never edited by the student. */
export default function PlacementSection({ profile }) {
  const placed = Boolean(profile?.isPlaced);
  const packageLpa = profile?.packageLpa;

  return (
    <ProfileSection
      title="Placement"
      description="Set automatically when you accept an offer. After that you can’t apply to new drives."
    >
      <dl className="grid grid-cols-1 rounded-lg border border-line sm:grid-cols-3">
        <Cell label="Status">
          <span className={chip(placed ? 'success' : 'neutral')}>{placed ? 'Placed' : 'Not placed'}</span>
        </Cell>
        <Cell label="Company">
          {profile?.placedCompany ? (
            <span className="font-medium text-ink">{profile.placedCompany}</span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </Cell>
        <Cell label="Package" last>
          {packageLpa !== null && packageLpa !== undefined ? (
            <span className="font-medium text-ink">
              {packageLpa} <span className="text-xs font-normal text-muted">LPA</span>
            </span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </Cell>
      </dl>
    </ProfileSection>
  );
}
