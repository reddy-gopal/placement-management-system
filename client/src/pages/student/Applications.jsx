import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { respondToOffer, withdrawApplication } from '../../services/applicationApi';
import CompanyLogo from '../../components/ui/CompanyLogo';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState } from '../../components/ui/States';
import ApplicationDetail from '../../components/student/ApplicationDetail';
import ConfirmDialog from '../../components/student/ConfirmDialog';
import Toast from '../../components/student/Toast';
import {
  applicationCompany,
  isOpenApplication,
  loadStudentContext,
  lpaLabel,
  offerText,
} from '../../components/student/studentPortal';

const TABS = [
  ['ALL', 'All'],
  ['APPLIED', 'Applied'],
  ['SHORTLISTED', 'Shortlisted'],
  ['SELECTED', 'Selected'],
  ['REJECTED', 'Rejected'],
];

/** "Oct 08" */
const shortDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date(value));

const GRID = 'grid grid-cols-[minmax(0,1fr)_auto] gap-4 md:grid-cols-[minmax(0,1fr)_110px_150px]';

function ApplicationRow({ application, selected, onSelect }) {
  const drive = application.driveId ?? {};
  const company = applicationCompany(application);
  const offer = offerText(application);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`${GRID} w-full items-center border-t border-line p-4 text-left ${
        selected ? 'bg-subtle lg:shadow-[inset_2px_0_0_#111]' : 'bg-white hover:bg-[#fafafb]'
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{drive.title ?? 'Job drive'}</span>
          <span className="mt-0.5 block truncate text-[13px] text-muted">{company.name}</span>
        </span>
      </span>
      <span className="hidden font-mono text-xs text-muted md:block">{shortDate(application.createdAt)}</span>
      <span className="flex flex-col items-end gap-1 md:items-start">
        <StatusBadge status={application.status} />
        {offer && <span className="text-[11px] text-muted">{offer}</span>}
      </span>
    </button>
  );
}

function ApplicationsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <p role="status" className="sr-only">
        Loading applications…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>
      <div aria-hidden="true" className="skeleton h-10 w-full" />
      <div aria-hidden="true" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
        <div className="skeleton hidden h-96 rounded-lg lg:block" />
      </div>
    </div>
  );
}

const DIALOGS = {
  withdraw: (a, company) => ({
    title: 'Withdraw your application?',
    body: `Your application to ${company} for ${a.driveId?.title} will be deleted and the recruiter will no longer see it.`,
    cta: 'Withdraw',
    tone: 'danger',
    toast: 'Application withdrawn',
  }),
  accept: (a, company, others) => ({
    title: `Accept the ${company} offer?`,
    body: `${a.driveId?.title} at ${lpaLabel(a.driveId?.packageLpa)}. You’ll be marked placed, ${
      others ? `your ${others} other open application${others === 1 ? '' : 's'} will be closed as REJECTED, ` : ''
    }and you won’t be able to apply to new drives. This can’t be undone.`,
    cta: 'Accept offer',
    tone: 'primary',
    toast: others ? 'Offer accepted · you’re placed. Other applications were closed.' : 'Offer accepted · you’re placed.',
  }),
  decline: () => ({
    title: 'Decline this offer?',
    body: 'The offer is declined and this application moves to REJECTED. This can’t be undone.',
    cta: 'Decline offer',
    tone: 'danger',
    toast: 'Offer declined',
  }),
};

/** Every application with its stage, interview details and any offer waiting for a response. */
export default function Applications() {
  const [searchParams] = useSearchParams();
  const linkedId = searchParams.get('application');
  const { data, status, error, reload } = useAsync(loadStudentContext, []);

  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(linkedId);
  const [mobileDetail, setMobileDetail] = useState(Boolean(linkedId));
  const [dialog, setDialog] = useState(null); // 'withdraw' | 'accept' | 'decline'
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');
  const hideToast = useCallback(() => setToast(''), []);

  const applications = useMemo(() => data?.applications ?? [], [data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (tab !== 'ALL' && a.status !== tab) return false;
      if (!term) return true;
      return `${a.driveId?.title ?? ''} ${applicationCompany(a).name ?? ''}`.toLowerCase().includes(term);
    });
  }, [applications, tab, search]);

  const selected = rows.find((a) => a._id === selectedId) ?? rows[0] ?? null;

  if (status === 'loading') return <ApplicationsSkeleton />;
  if (status === 'error') {
    return <ErrorState title="We couldn't load your applications." message={error} onRetry={() => reload()} />;
  }

  const count = (key) => (key === 'ALL' ? applications.length : applications.filter((a) => a.status === key).length);

  const select = (application) => {
    setSelectedId(application._id);
    setMobileDetail(true);
    if (window.matchMedia?.('(max-width: 1023px)').matches) window.scrollTo?.({ top: 0 });
  };

  const companyName = selected ? (applicationCompany(selected).name ?? 'the company') : '';
  const others = selected ? applications.filter((a) => a._id !== selected._id && isOpenApplication(a)).length : 0;
  const dialogContent = dialog && selected ? DIALOGS[dialog](selected, companyName, others) : null;

  const openDialog = (name) => {
    setActionError('');
    setDialog(name);
  };

  const confirm = async () => {
    setBusy(true);
    setActionError('');
    try {
      if (dialog === 'withdraw') {
        await withdrawApplication(selected._id);
        setSelectedId(null);
        setMobileDetail(false);
      } else {
        await respondToOffer(selected._id, dialog === 'accept' ? 'ACCEPT' : 'DECLINE');
      }
      setToast(dialogContent.toast);
      setDialog(null);
      reload({ silent: true });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!applications.length) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        {data.profile ? (
          <EmptyState
            title="No applications yet"
            message="When you apply to a drive it shows up here with its stage, interview details and any offer."
            action={
              <Link to="/student/drives" className="btn">
                Browse job drives
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Complete your profile to start applying"
            message="Recruiters check your CGPA, backlogs and branch, so you need a profile before you can apply to drives."
            action={
              <Link to="/student/profile" className="btn">
                Complete profile
              </Link>
            }
          />
        )}
        <Toast message={toast} onDismiss={hideToast} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={`flex flex-col gap-6 ${mobileDetail ? 'hidden lg:flex' : ''}`}>
        <Header>
          <label className="search w-full sm:w-80">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company or role"
              aria-label="Search applications"
            />
          </label>
        </Header>

        <div role="tablist" aria-label="Filter by status" className="relative -mx-4 flex overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              aria-controls="applications-list"
              className="tab"
              onClick={() => setTab(key)}
            >
              {label}
              <span className="count">{count(key)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <section
          id="applications-list"
          aria-label="Applications"
          className={`min-w-0 overflow-hidden rounded-lg border border-line ${mobileDetail ? 'hidden lg:block' : ''}`}
        >
          <div className={`${GRID} data-head px-4 py-2.5`}>
            <span>Role</span>
            <span className="hidden md:block">Applied</span>
            <span className="text-right md:text-left">Status</span>
          </div>
          {rows.length ? (
            rows.map((application) => (
              <ApplicationRow
                key={application._id}
                application={application}
                selected={selected?._id === application._id}
                onSelect={() => select(application)}
              />
            ))
          ) : (
            <div className="border-t border-line px-6 py-12 text-center">
              <p className="text-[15px] font-semibold">Nothing here yet</p>
              <p className="mt-1.5 text-[13px] text-muted">No applications match this filter.</p>
            </div>
          )}
        </section>

        {selected && (
          <div className={mobileDetail ? '' : 'hidden lg:block'}>
            <ApplicationDetail
              key={selected._id}
              application={selected}
              onAccept={() => openDialog('accept')}
              onDecline={() => openDialog('decline')}
              onWithdraw={() => openDialog('withdraw')}
              onBack={() => setMobileDetail(false)}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(dialogContent)}
        title={dialogContent?.title}
        confirmLabel={dialogContent?.cta}
        tone={dialogContent?.tone}
        busy={busy}
        error={actionError}
        onConfirm={confirm}
        onClose={() => setDialog(null)}
      >
        {dialogContent?.body}
      </ConfirmDialog>

      <Toast message={toast} onDismiss={hideToast} />
    </div>
  );
}

function Header({ children }) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] md:text-[32px]">My applications</h1>
        <p className="mt-1.5 text-sm text-muted">
          Every application, its stage, interview details and any offer waiting for you.
        </p>
      </div>
      {children}
    </section>
  );
}
