import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { listDrives } from '../../services/driveApi';
import { getStudentProfile } from '../../services/studentProfileApi';
import { EmptyState, ErrorState } from '../../components/ui/States';
import DriveCard from '../../components/student/DriveCard';
import DriveFilters from '../../components/student/DriveFilters';
import Pagination from '../../components/student/Pagination';
import { applicationsByDrive, loadMyApplications } from '../../components/student/studentPortal';

const PAGE_SIZE = 10;
/** Eligibility isn't a server filter, so "Eligible only" filters the newest 100 matches locally. */
const ELIGIBLE_SCAN_LIMIT = 100;
const NO_FILTERS = { eligibleOnly: false, employmentType: '', location: '', minPackage: 0 };

/** Profile, applications (for "Applied" states) and the most common locations among open drives. */
async function loadContext() {
  const [profile, applications, open] = await Promise.all([
    getStudentProfile(),
    loadMyApplications(),
    listDrives({ limit: 100 }),
  ]);
  const counts = new Map();
  (open.drives ?? []).forEach((drive) => {
    const location = drive.location?.trim();
    if (location) counts.set(location, (counts.get(location) ?? 0) + 1);
  });
  const locations = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([location]) => location);
  return { profile, applications, locations };
}

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="sr-only">
        Loading drives…
      </p>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} aria-hidden="true" className="flex gap-5 rounded-lg border border-line p-5">
          <div className="skeleton h-11 w-11 shrink-0 rounded-md" />
          <div className="flex flex-1 flex-col gap-2.5">
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-3.5 w-1/4" />
            <div className="skeleton h-3.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Browse open drives: server-side search and filters, eligibility verdicts, pagination. */
export default function Drives() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = useDebounced(search.trim());

  const context = useAsync(loadContext, []);

  const { eligibleOnly, employmentType, location, minPackage } = filters;
  const params = {
    ...(query && { search: query }),
    ...(location && { location }),
    ...(minPackage > 0 && { minPackage }),
    ...(employmentType && { employmentType }),
  };
  const results = useAsync(
    () =>
      listDrives(
        eligibleOnly ? { ...params, page: 1, limit: ELIGIBLE_SCAN_LIMIT } : { ...params, page, limit: PAGE_SIZE }
      ),
    [query, employmentType, location, minPackage, eligibleOnly, eligibleOnly ? 0 : page]
  );

  const profile = context.data?.profile ?? null;
  const applied = useMemo(() => applicationsByDrive(context.data?.applications), [context.data]);

  const view = useMemo(() => {
    if (!results.data) return null;
    const { drives = [], total = 0 } = results.data;
    if (!eligibleOnly) return { drives, total, truncated: false };
    const eligible = drives.filter((drive) => drive.isEligible);
    return {
      drives: eligible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: eligible.length,
      truncated: total > drives.length,
    };
  }, [results.data, eligibleOnly, page]);

  const activeFilterCount =
    Number(eligibleOnly) + Number(Boolean(employmentType)) + Number(Boolean(location)) + Number(minPackage > 0);
  const isFiltered = Boolean(query) || activeFilterCount > 0;

  // A new search or filter starts again from the first page.
  const updateFilters = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const reset = () => {
    setFilters(NO_FILTERS);
    updateSearch('');
  };

  if (context.status === 'error') {
    return <ErrorState title="We couldn't load job drives." message={context.error} onRetry={() => context.reload()} />;
  }

  return (
    <div className="flex flex-col gap-6 md:gap-7">
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] md:text-[32px]">Job drives</h1>
          <p className="mt-1.5 text-sm text-muted">
            Open drives from recruiters on campus. Eligibility is checked against your profile.
          </p>
        </div>
        <div className="flex w-full flex-[1_1_320px] items-center justify-end gap-2.5 md:w-auto">
          <label className="search flex-1 md:max-w-95">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search job titles"
              aria-label="Search job titles"
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary lg:hidden"
            aria-expanded={filtersOpen}
            aria-controls="drive-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded border border-ink bg-lime px-1.5 font-mono text-[11px] leading-4.5 text-ink">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <DriveFilters
          id="drive-filters"
          className={`${filtersOpen ? 'flex' : 'hidden'} lg:flex`}
          filters={filters}
          onChange={updateFilters}
          onReset={reset}
          locations={context.data?.locations ?? []}
          profile={profile}
        />

        <section aria-label="Results" className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between pb-1 text-[13px] text-muted">
            <span aria-live="polite">
              {view && (
                <>
                  <strong className="font-semibold text-ink">{view.total}</strong>{' '}
                  {eligibleOnly ? 'eligible ' : ''}drive{view.total === 1 ? '' : 's'}
                </>
              )}
            </span>
            <span>Newest first</span>
          </div>

          {results.status === 'loading' || context.status === 'loading' ? (
            <ResultsSkeleton />
          ) : results.status === 'error' ? (
            <ErrorState title="We couldn't load job drives." message={results.error} onRetry={() => results.reload()} />
          ) : view.drives.length === 0 ? (
            isFiltered ? (
              <EmptyState
                title="No drives match these filters"
                message="Try a lower package, another location, or turn off “Eligible only”."
                action={
                  <button type="button" onClick={reset} className="btn btn-secondary btn-sm">
                    Reset filters
                  </button>
                }
              />
            ) : (
              <EmptyState
                title="No open drives right now"
                message="Recruiters haven’t opened any drives yet. Keep your profile up to date so you’re ready when they do."
                action={
                  <Link to="/student/profile" className="btn btn-secondary btn-sm">
                    Review your profile
                  </Link>
                }
              />
            )
          ) : (
            <>
              {view.drives.map((drive) => (
                <DriveCard key={drive._id} drive={drive} profile={profile} application={applied.get(String(drive._id))} />
              ))}
              {view.truncated && (
                <p className="text-xs text-muted">
                  Eligible drives are picked from the {ELIGIBLE_SCAN_LIMIT} newest matches. Narrow your search to see older ones.
                </p>
              )}
              <Pagination page={page} pageCount={Math.ceil(view.total / PAGE_SIZE)} onChange={setPage} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
