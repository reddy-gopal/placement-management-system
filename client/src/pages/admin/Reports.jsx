import { useMemo, useState } from 'react';
import useAsync from '../../hooks/useAsync';
import { getAdminApplications, getAdminDrives, getAdminStudents } from '../../services/adminApi';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import {
  branchBreakdown,
  companyRecruitment,
  employmentTypeMix,
  formatPercent,
  graduationYears,
  inBatch,
  packageBands,
  packageStats,
  percentOf,
} from '../../components/admin/adminInsights';
import { formatCount, formatDate, formatLpa } from '../../utils/format';

const TOP_COMPANIES = 7;
const TYPE_COLOURS = { FULL_TIME: '#111111', INTERNSHIP: '#9B5CFF', CONTRACT: '#45E6E6' };

async function loadReports() {
  const [students, drives, applications] = await Promise.all([
    getAdminStudents(),
    getAdminDrives(),
    getAdminApplications(),
  ]);
  return { students: students ?? [], drives: drives ?? [], applications: applications ?? [] };
}

/** Report block: heavy top rule, title row with a note or legend on the right. */
function ReportSection({ title, aside, children, className = '' }) {
  const id = `report-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <section aria-labelledby={id} className={`flex min-w-0 flex-col gap-5 border-t border-ink pt-6 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-lg font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

const Note = ({ children }) => <span className="text-xs text-muted">{children}</span>;

function Swatch({ colour, outlined = false }) {
  return (
    <span
      aria-hidden="true"
      className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-xs align-[-1px] ${outlined ? 'border border-ink' : ''}`}
      style={{ background: colour }}
    />
  );
}

function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted">
      {items.map(({ label, colour, outlined }) => (
        <span key={label}>
          <Swatch colour={colour} outlined={outlined} />
          {label}
        </span>
      ))}
    </div>
  );
}

function PlacedVsUnplaced({ students }) {
  const placed = students.filter((s) => s.isPlaced).length;
  const unplaced = students.length - placed;
  const share = percentOf(placed, students.length);
  return (
    <ReportSection title="Placed vs. unplaced" aside={<Note>{formatCount(students.length)} students</Note>}>
      <div className="flex flex-wrap items-center gap-10">
        <div>
          <div className="text-[56px] font-semibold leading-none tracking-tighter sm:text-[72px]">
            <span className="highlight">{formatPercent(share)}</span>
          </div>
          <div className="mt-2 text-sm text-muted">
            {formatCount(placed)} placed · {formatCount(unplaced)} not yet placed
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
          <div
            role="img"
            aria-label={`${formatPercent(share)} placed: ${placed} of ${students.length} students`}
            className="flex h-10 overflow-hidden rounded border border-ink"
          >
            <div className="bg-ink" style={{ width: `${share}%` }} />
            <div className="flex-1 bg-[repeating-linear-gradient(135deg,#fff_0_6px,#F2F2F4_6px_7px)]" />
          </div>
          <Legend
            items={[
              { label: `Placed ${formatCount(placed)}`, colour: '#111' },
              { label: `Not placed ${formatCount(unplaced)}`, colour: '#F2F2F4', outlined: true },
            ]}
          />
        </div>
      </div>
    </ReportSection>
  );
}

function BranchOutcomes({ students }) {
  const branches = branchBreakdown(students);
  const maxTotal = Math.max(1, ...branches.map((b) => b.total));
  return (
    <ReportSection
      title="Branch-wise outcomes"
      aside={
        <Legend
          items={[
            { label: 'Placed', colour: '#111' },
            { label: 'Not placed', colour: '#E7E7EB' },
            { label: 'Highest rate', colour: '#C6FF00', outlined: true },
          ]}
        />
      }
    >
      {branches.length === 0 ? (
        <p className="text-sm text-muted">No students in this batch.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3.5">
            {branches.map((b, index) => {
              const best = index === 0 && b.placed > 0;
              return (
                <li key={b.branch} className="grid grid-cols-[48px_minmax(0,1fr)_112px] items-center gap-3 text-[13px] sm:grid-cols-[64px_minmax(0,1fr)_140px] sm:gap-4">
                  <span className="font-semibold">{b.branch}</span>
                  <div
                    aria-hidden="true"
                    className="flex h-6 min-w-20"
                    style={{ width: `${percentOf(b.total, maxTotal)}%` }}
                  >
                    {b.placed > 0 && (
                      <div
                        className={`rounded-l-[3px] ${best ? 'border border-ink bg-lime' : 'bg-ink'} ${b.placed === b.total ? 'rounded-r-[3px]' : ''}`}
                        style={{ width: `${b.rate}%` }}
                      />
                    )}
                    {b.placed < b.total && <div className={`flex-1 bg-line ${b.placed ? 'rounded-r-[3px]' : 'rounded-[3px]'}`} />}
                  </div>
                  <span className="font-mono text-xs">
                    <strong className="font-semibold">{Math.round(b.rate)}%</strong>{' '}
                    <span className="text-muted">
                      · {b.placed} / {b.total}
                    </span>
                    <span className="sr-only"> students placed</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted">Bar length is proportional to branch size.</p>
        </>
      )}
    </ReportSection>
  );
}

function PackageDistribution({ students }) {
  const stats = packageStats(students);
  const bands = packageBands(students);
  const peak = Math.max(1, ...bands.map((b) => b.count));
  const peakBand = bands.find((b) => b.isPeak);
  return (
    <ReportSection title="Package distribution" aside={<Note>Placed students · LPA</Note>}>
      <dl className="flex flex-wrap gap-6">
        {[
          ['Median', stats.median],
          ['Average', stats.average],
          ['Highest', stats.highest],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="eyebrow">{label}</dt>
            <dd className="mt-1.5 text-2xl font-semibold">{value === null ? '—' : formatLpa(Math.round(value * 10) / 10)}</dd>
          </div>
        ))}
      </dl>
      {stats.count === 0 ? (
        <p className="text-sm text-muted">No placed students with a recorded package yet.</p>
      ) : (
        <figure
          role="img"
          aria-label={`Histogram of ${stats.count} placement packages in LPA: ${bands
            .map((b) => `${b.label} LPA ${b.count}`)
            .join(', ')}. Most placements fall in the ${peakBand.label} LPA band.`}
          className="m-0 flex flex-col gap-2"
        >
          <div className="flex h-50 items-end gap-1.5 border-b border-ink sm:gap-2.5" aria-hidden="true">
            {bands.map((b) => (
              <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="font-mono text-[11px] font-medium">{b.count}</span>
                <div
                  className={`w-full rounded-t-[3px] ${b.isPeak ? 'border border-ink bg-lime' : 'bg-ink'}`}
                  style={{ height: `${percentOf(b.count, peak) * 0.85}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 sm:gap-2.5" aria-hidden="true">
            {bands.map((b) => (
              <span key={b.label} className="flex-1 text-center font-mono text-[11px] text-muted">
                {b.label}
              </span>
            ))}
          </div>
        </figure>
      )}
    </ReportSection>
  );
}

function EmploymentTypes({ drives }) {
  const mix = employmentTypeMix(drives);
  const present = mix.filter((m) => m.count > 0);
  return (
    <ReportSection
      title="Employment type"
      aside={
        <Note>
          {formatCount(drives.length)} job drive{drives.length === 1 ? '' : 's'}
        </Note>
      }
    >
      {drives.length === 0 ? (
        <p className="text-sm text-muted">No job drives posted yet.</p>
      ) : (
        <>
          <div
            role="img"
            aria-label={mix.map((m) => `${m.label} ${Math.round(m.share)} percent`).join(', ')}
            className="flex h-10 overflow-hidden rounded border border-ink"
          >
            {present.map((m, index) => (
              <div
                key={m.type}
                className={index > 0 ? 'border-l-2 border-white' : ''}
                style={{ width: `${m.share}%`, background: TYPE_COLOURS[m.type] }}
              />
            ))}
          </div>
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Job drives by employment type</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Drives</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {mix.map((m) => (
                <tr key={m.type} className="border-y border-line">
                  <th scope="row" className="py-3 text-left font-normal">
                    <Swatch colour={TYPE_COLOURS[m.type]} />
                    {m.label}
                  </th>
                  <td className="w-15 py-3 text-right font-mono">{m.count}</td>
                  <td className="w-15 py-3 text-right font-mono text-muted">{Math.round(m.share)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </ReportSection>
  );
}

const COMPANY_GRID = 'grid grid-cols-[minmax(180px,1.2fr)_70px_100px_minmax(240px,2fr)_70px] gap-4';

function CompanyRecruitment({ drives, applications }) {
  const all = companyRecruitment(drives, applications);
  const rows = all.slice(0, TOP_COMPANIES);
  const maxSelected = Math.max(1, ...rows.map((r) => r.selected));
  return (
    <ReportSection
      title="Company-wise recruitment"
      aside={<Note>{all.length > TOP_COMPANIES ? `Top ${TOP_COMPANIES} by students selected` : 'By students selected'}</Note>}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No companies have posted drives yet.</p>
      ) : (
        <div className="relative overflow-x-auto">
          <div role="table" aria-label="Company-wise recruitment" className="min-w-190">
            <div role="row" className={`${COMPANY_GRID} pb-2.5`}>
              <span role="columnheader" className="eyebrow">Company</span>
              <span role="columnheader" className="eyebrow">Drives</span>
              <span role="columnheader" className="eyebrow">Applications</span>
              <span role="columnheader" className="eyebrow">Selected</span>
              <span role="columnheader" className="eyebrow">Avg LPA</span>
            </div>
            {rows.map((row, index) => (
              <div role="row" key={row.id} className={`${COMPANY_GRID} items-center border-t border-line py-3 text-[13px]`}>
                <span role="cell" className="text-sm font-semibold">{row.name}</span>
                <span role="cell" className="font-mono">{row.drives}</span>
                <span role="cell" className="font-mono text-muted">{formatCount(row.applications)}</span>
                <span role="cell" className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="h-2.5 flex-1 rounded-xs bg-[#F2F2F4]">
                    <span
                      className={`block h-full rounded-xs ${index === 0 && row.selected > 0 ? 'bg-lime shadow-[inset_0_0_0_1px_#111]' : 'bg-ink'}`}
                      style={{ width: `${percentOf(row.selected, maxSelected)}%` }}
                    />
                  </span>
                  <span className="min-w-7 font-mono font-medium">{row.selected}</span>
                </span>
                <span role="cell" className="font-mono">{row.avgLpa === null ? '—' : formatLpa(Math.round(row.avgLpa * 10) / 10)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportSection>
  );
}

/** /admin/reports — placement outcomes by batch, branch, package band, employment type and company. */
export default function Reports() {
  const { data, status, error, reload } = useAsync(loadReports, []);
  const [batch, setBatch] = useState('');

  const years = useMemo(() => graduationYears(data?.students), [data]);
  const students = useMemo(() => inBatch(data?.students ?? [], batch), [data, batch]);
  const applications = useMemo(
    () =>
      batch
        ? (data?.applications ?? []).filter((app) => Number(app.studentId?.graduationYear) === Number(batch))
        : (data?.applications ?? []),
    [data, batch]
  );

  const eyebrow = `${batch ? `Batch ${batch}` : 'All batches'} · as of ${formatDate(new Date())}`;
  const batchPicker = status === 'ready' && years.length > 0 && (
    <label className="flex items-center gap-2 text-[13px] text-muted">
      Graduating batch
      <select className="input w-auto font-medium" value={batch} onChange={(event) => setBatch(event.target.value)}>
        <option value="">All batches</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="flex flex-col gap-12">
      <PageHeader eyebrow={eyebrow} title="Placement reports" actions={batchPicker || undefined} />

      {status === 'loading' && <LoadingState label="Loading placement reports…" rows={5} />}
      {status === 'error' && <ErrorState title="We couldn't load placement reports." message={error} onRetry={reload} />}

      {status === 'ready' && data.students.length === 0 && data.drives.length === 0 && (
        <EmptyState
          title="No placement data yet"
          message="Reports fill in once students create profiles and recruiters post job drives."
        />
      )}

      {status === 'ready' && (data.students.length > 0 || data.drives.length > 0) && (
        <>
          <PlacedVsUnplaced students={students} />
          <BranchOutcomes students={students} />
          <div className="grid gap-12 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <PackageDistribution students={students} />
            <EmploymentTypes drives={data.drives} />
          </div>
          <CompanyRecruitment drives={data.drives} applications={applications} />
        </>
      )}
    </div>
  );
}
