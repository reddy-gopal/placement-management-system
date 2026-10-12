import { EMPLOYMENT_TYPE_LABELS } from '../../utils/format';

const TYPES = [['', 'All'], ...Object.entries(EMPLOYMENT_TYPE_LABELS)];
const PACKAGES = [
  [0, 'Any'],
  [6, '6+ LPA'],
  [10, '10+ LPA'],
  [15, '15+ LPA'],
  [20, '20+ LPA'],
];

function ChipGroup({ legend, options, value, onChange }) {
  return (
    <fieldset className="flex flex-col">
      <legend className="eyebrow mb-2.5">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([optionValue, label]) => (
          <button
            key={label}
            type="button"
            className="chip"
            aria-pressed={value === optionValue}
            onClick={() => onChange(optionValue)}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Filter rail for the drives list. `filters`: { eligibleOnly, employmentType, location, minPackage }.
 * Location options come from the open drives' own locations.
 */
export default function DriveFilters({ filters, onChange, onReset, locations, profile, id, className = '' }) {
  const set = (key) => (value) => onChange({ [key]: value });
  const profileLine = profile
    ? `CGPA ${profile.cgpa} · ${profile.branch} · ${profile.activeBacklogs} backlog${profile.activeBacklogs === 1 ? '' : 's'}`
    : 'Create your profile to check eligibility';

  return (
    <aside id={id} aria-label="Filters" className={`flex-col gap-6 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Filters</span>
        <button type="button" onClick={onReset} className="link py-1 text-[13px] font-medium text-muted hover:text-ink">
          Reset
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-line p-3.5">
        <span id="eligible-only-label" className="text-[13px] leading-snug">
          <strong className="block font-semibold">Eligible only</strong>
          <span className="text-xs text-muted">{profileLine}</span>
        </span>
        <button
          type="button"
          role="switch"
          className="toggle disabled:cursor-not-allowed disabled:opacity-50"
          aria-checked={filters.eligibleOnly}
          aria-labelledby="eligible-only-label"
          disabled={!profile}
          onClick={() => onChange({ eligibleOnly: !filters.eligibleOnly })}
        />
      </div>

      <ChipGroup legend="Employment type" options={TYPES} value={filters.employmentType} onChange={set('employmentType')} />
      {locations.length > 0 && (
        <ChipGroup
          legend="Location"
          options={[['', 'All'], ...locations.map((l) => [l, l])]}
          value={filters.location}
          onChange={set('location')}
        />
      )}
      <ChipGroup legend="Minimum package" options={PACKAGES} value={filters.minPackage} onChange={set('minPackage')} />

      <p className="text-xs leading-normal text-muted">
        Only OPEN drives with a future deadline are listed, each checked against your profile.
      </p>
    </aside>
  );
}
