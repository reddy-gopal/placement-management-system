import { useEffect, useId, useMemo, useState } from 'react';
import useAsync from '../../hooks/useAsync';
import { deleteStudent, getAdminApplications, getAdminDrives, getAdminStudents } from '../../services/adminApi';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import SearchField from '../../components/admin/SearchField';
import {
  activeOpenDrives,
  applicationsByStudent,
  filterStudents,
  graduationYears,
  isEligible,
  pageList,
  refId,
  sortStudents,
  studentEmail,
  studentName,
} from '../../components/admin/adminInsights';
import { BRANCHES } from '../../constants/studentProfile';
import { formatCount, formatDate, formatLpa } from '../../utils/format';

const PAGE_SIZE = 10;
const GRID =
  'grid grid-cols-[minmax(220px,1.6fr)_100px_64px_60px_72px_80px_60px_120px_minmax(160px,1fr)_32px] items-center gap-3 px-4';
const PLACEMENT_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PLACED', label: 'Placed' },
  { value: 'NOT_PLACED', label: 'Not placed' },
];
const EMPTY_FILTERS = { query: '', branch: '', year: '', placement: 'ALL' };
const DEFAULT_SORT = { key: 'cgpa', direction: 'desc' };

async function loadStudents() {
  const [students, applications, drives] = await Promise.all([
    getAdminStudents(),
    getAdminApplications(),
    getAdminDrives(),
  ]);
  return { students: students ?? [], applications: applications ?? [], drives: drives ?? [] };
}

/** "vikram-rao-resume.pdf" from a resume URL, or a generic label. */
function resumeFileName(url) {
  try {
    const name = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() ?? '');
    return name || 'Open resume';
  } catch {
    return 'Open resume';
  }
}

/** Column header; sortable ones are buttons and expose aria-sort. */
function HeaderCell({ label, sortKey, sort, onSort }) {
  if (!sortKey) {
    return (
      <span role="columnheader" className="eyebrow">
        {label}
      </span>
    );
  }
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <span role="columnheader" aria-sort={ariaSort} className="eyebrow">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`eyebrow inline-flex items-center gap-1 rounded hover:text-ink ${active ? 'text-ink' : ''}`}
      >
        {label}
        <span aria-hidden="true">{active ? (sort.direction === 'asc' ? '↑' : '↓') : ''}</span>
      </button>
    </span>
  );
}

/** Expanded row: eligibility, skills, application outcomes, resume and the delete action. */
function StudentDetails({ id, student, apps, openDrives, onDelete }) {
  const eligible = openDrives.filter((drive) => isEligible(student, drive)).length;
  const backlogs = Number(student.activeBacklogs) || 0;
  const accepted = apps?.accepted;
  const placementNote = accepted
    ? `Offer accepted from ${accepted.company ?? student.placedCompany ?? 'a company'}${
        accepted.respondedAt ? ` on ${formatDate(accepted.respondedAt, { withYear: false })}` : ''
      }`
    : student.isPlaced
      ? `Placed at ${student.placedCompany ?? 'a company'}`
      : 'Not placed yet';

  return (
    <div role="row" id={id}>
      <div
        role="cell"
        className="grid grid-cols-1 gap-6 border-t border-line bg-subtle px-4 pb-6 pt-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <div className="eyebrow">Academic eligibility</div>
          <div className="mt-2 text-[13px] leading-[1.7]">
            CGPA {Number(student.cgpa).toFixed(2)} · {backlogs} active backlog{backlogs === 1 ? '' : 's'}
            <br />
            {openDrives.length
              ? `Eligible for ${eligible} of ${openDrives.length} open drive${openDrives.length === 1 ? '' : 's'}`
              : 'No open drives right now'}
          </div>
        </div>
        <div>
          <div className="eyebrow">Skills</div>
          <div className="mt-2 text-[13px] leading-[1.7]">
            {student.skills?.length ? student.skills.join(', ') : <span className="text-muted">None listed</span>}
          </div>
        </div>
        <div>
          <div className="eyebrow">Applications · {apps?.total ?? 0}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {apps?.total ? (
              ['SELECTED', 'SHORTLISTED', 'APPLIED', 'REJECTED']
                .filter((status) => apps[status] > 0)
                .map((status) => (
                  <StatusBadge key={status} status={status}>
                    {apps[status]} {status}
                  </StatusBadge>
                ))
            ) : (
              <span className="text-[13px] text-muted">No applications yet</span>
            )}
          </div>
        </div>
        <div>
          <div className="eyebrow">Resume</div>
          {student.resumeUrl ? (
            <a
              href={student.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block break-all text-[13px] underline"
            >
              {resumeFileName(student.resumeUrl)} ↗<span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <div className="mt-2 text-[13px] text-muted">Not uploaded</div>
          )}
        </div>
        <div className="col-span-full flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
          <span className="text-xs text-muted">
            {placementNote} · deleting a profile asks for confirmation and can’t be undone.
          </span>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(student)}>
            Delete student profile…
          </button>
        </div>
      </div>
    </div>
  );
}

/** One student row plus its expandable details. */
function StudentRow({ student, apps, expanded, onToggle, openDrives, onDelete }) {
  const detailsId = useId();
  const name = studentName(student);
  const backlogs = Number(student.activeBacklogs) || 0;
  return (
    <div role="rowgroup">
      <div role="row" className={`${GRID} border-t border-line py-3 text-[13px] ${expanded ? 'bg-subtle' : 'hover:bg-[#FAFAFB]'}`}>
        <span role="cell" className="min-w-0">
          <span className="block text-sm font-semibold">{name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">{studentEmail(student)}</span>
        </span>
        <span role="cell" className="font-mono text-xs">
          {student.rollNumber}
        </span>
        <span role="cell">{student.branch}</span>
        <span role="cell" className="font-mono text-muted">
          {student.graduationYear}
        </span>
        <span role="cell" className="font-mono font-medium">
          {Number(student.cgpa).toFixed(2)}
        </span>
        <span role="cell" className={`font-mono ${backlogs ? 'text-warning' : 'text-muted'}`}>
          {backlogs}
        </span>
        <span role="cell" className="font-mono">
          {apps?.total ?? 0}
        </span>
        <span role="cell">
          {student.isPlaced ? <StatusBadge status="PLACED" /> : <span className="badge">Not placed</span>}
        </span>
        <span role="cell" className="min-w-0 truncate">
          {student.isPlaced ? (
            `${student.placedCompany ?? '—'}${student.packageLpa != null ? ` · ${formatLpa(student.packageLpa)} LPA` : ''}`
          ) : (
            <span className="text-muted">—</span>
          )}
        </span>
        <span role="cell">
          <button
            type="button"
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${name}`}
            aria-expanded={expanded}
            aria-controls={expanded ? detailsId : undefined}
            onClick={onToggle}
            className="grid h-7 w-7 place-items-center rounded border border-line bg-white text-xs hover:border-ink"
          >
            <span aria-hidden="true">{expanded ? '▴' : '▾'}</span>
          </button>
        </span>
      </div>
      {expanded && (
        <StudentDetails id={detailsId} student={student} apps={apps} openDrives={openDrives} onDelete={onDelete} />
      )}
    </div>
  );
}

function Pagination({ page, pageCount, onPage, summary }) {
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
      <span>{summary}</span>
      {pageCount > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="page-btn" aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)}>
            ‹
          </button>
          {pageList(page, pageCount).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 py-2" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className="page-btn"
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            className="page-btn"
            aria-label="Next page"
            disabled={page === pageCount}
            onClick={() => onPage(page + 1)}
          >
            ›
          </button>
        </div>
      )}
    </nav>
  );
}

/** /admin/students — searchable, filterable directory of every student profile. */
export default function Students() {
  const { data, status, error, reload, setData } = useAsync(loadStudents, []);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const students = data?.students ?? [];
  const appsByStudent = useMemo(() => applicationsByStudent(data?.applications), [data]);
  const openDrives = useMemo(() => activeOpenDrives(data?.drives), [data]);
  const years = useMemo(() => graduationYears(students), [students]);
  const filtered = useMemo(
    () => sortStudents(filterStudents(students, filters), sort, appsByStudent),
    [students, filters, sort, appsByStudent]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setPage(1), [filters, sort]);

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const toggleSort = (key) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: ['name', 'roll'].includes(key) ? 'asc' : 'desc' }
    );

  const confirmDelete = async () => {
    const target = pendingDelete;
    await deleteStudent(target._id);
    setData((current) => ({
      ...current,
      students: current.students.filter((s) => s._id !== target._id),
      applications: current.applications.filter((app) => refId(app.studentId) !== target._id),
    }));
    setExpandedId(null);
    setPendingDelete(null);
  };

  const description =
    status === 'ready'
      ? `${formatCount(students.length)} registered student profile${students.length === 1 ? '' : 's'}${
          filters.year ? ` · batch ${filters.year}` : ''
        }`
      : undefined;

  const scope =
    filters.placement === 'PLACED' ? 'placed students' : filters.placement === 'NOT_PLACED' ? 'unplaced students' : 'students';
  const summary = filtered.length
    ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${(currentPage - 1) * PAGE_SIZE + rows.length} of ${formatCount(filtered.length)} ${scope}`
    : `No ${scope} to show`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Students" description={description} />

      {status === 'loading' && <LoadingState label="Loading students…" rows={6} />}
      {status === 'error' && <ErrorState title="We couldn't load students." message={error} onRetry={reload} />}

      {status === 'ready' && students.length === 0 && (
        <EmptyState title="No student profiles yet" message="Students appear here once they create their placement profile." />
      )}

      {status === 'ready' && students.length > 0 && (
        <>
          <section aria-label="Filters" className="flex flex-wrap items-center gap-2.5">
            <SearchField
              label="Search students"
              placeholder="Name, email or roll number"
              value={filters.query}
              onChange={(value) => updateFilter('query', value)}
              className="min-w-0 flex-[1_1_280px] sm:max-w-90"
            />
            <label className="sr-only" htmlFor="student-branch">
              Branch
            </label>
            <select
              id="student-branch"
              className="input w-auto"
              value={filters.branch}
              onChange={(event) => updateFilter('branch', event.target.value)}
            >
              <option value="">All branches</option>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="student-year">
              Graduation year
            </label>
            <select
              id="student-year"
              className="input w-auto"
              value={filters.year}
              onChange={(event) => updateFilter('year', event.target.value)}
            >
              <option value="">All years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
            <div role="group" aria-label="Placement status" className="flex gap-1.5">
              {PLACEMENT_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="chip"
                  aria-pressed={filters.placement === option.value}
                  onClick={() => updateFilter('placement', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {isFiltered && (
              <button type="button" className="link px-1 py-2 text-[13px] font-medium text-muted" onClick={() => setFilters(EMPTY_FILTERS)}>
                Reset
              </button>
            )}
          </section>

          <section aria-label="Student directory" className="relative overflow-x-auto rounded-lg border border-line">
            <div role="table" aria-label="Students" className="min-w-277">
              <div role="rowgroup">
                <div role="row" className={`${GRID} bg-subtle py-2.5`}>
                  <HeaderCell label="Student" sortKey="name" sort={sort} onSort={toggleSort} />
                  <HeaderCell label="Roll no." sortKey="roll" sort={sort} onSort={toggleSort} />
                  <HeaderCell label="Branch" />
                  <HeaderCell label="Year" />
                  <HeaderCell label="CGPA" sortKey="cgpa" sort={sort} onSort={toggleSort} />
                  <HeaderCell label="Backlogs" sortKey="backlogs" sort={sort} onSort={toggleSort} />
                  <HeaderCell label="Apps" sortKey="apps" sort={sort} onSort={toggleSort} />
                  <HeaderCell label="Placement" />
                  <HeaderCell label="Placed at" sortKey="package" sort={sort} onSort={toggleSort} />
                  <span role="columnheader">
                    <span className="sr-only">Details</span>
                  </span>
                </div>
              </div>
              {rows.map((student) => (
                <StudentRow
                  key={student._id}
                  student={student}
                  apps={appsByStudent.get(student._id)}
                  expanded={expandedId === student._id}
                  onToggle={() => setExpandedId((id) => (id === student._id ? null : student._id))}
                  openDrives={openDrives}
                  onDelete={setPendingDelete}
                />
              ))}
              {rows.length === 0 && (
                <div role="rowgroup">
                  <div role="row">
                    <p role="cell" className="border-t border-line px-4 py-10 text-center text-sm text-muted">
                      No students match these filters.{' '}
                      <button type="button" className="link text-ink" onClick={() => setFilters(EMPTY_FILTERS)}>
                        Clear filters
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <Pagination page={currentPage} pageCount={pageCount} onPage={setPage} summary={summary} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete student profile?"
        confirmLabel="Delete profile"
        busyLabel="Deleting…"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      >
        {pendingDelete && (
          <p>
            <strong className="font-semibold">{studentName(pendingDelete)}</strong> ({pendingDelete.rollNumber})’s placement
            profile and all {appsByStudent.get(pendingDelete._id)?.total ?? 0} of their applications will be permanently
            deleted. Their sign-in account is not removed. This can’t be undone.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
