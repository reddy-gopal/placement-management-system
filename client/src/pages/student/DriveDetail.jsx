import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { usePageTitle } from '../../components/layout/dashboardIdentity';
import { getDrive } from '../../services/driveApi';
import { getStudentProfile } from '../../services/studentProfileApi';
import { applyToDrive, withdrawApplication } from '../../services/applicationApi';
import CompanyLogo from '../../components/ui/CompanyLogo';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState } from '../../components/ui/States';
import DriveApplyPanel from '../../components/student/DriveApplyPanel';
import ConfirmDialog from '../../components/student/ConfirmDialog';
import { applicationsByDrive, loadMyApplications, lpaLabel } from '../../components/student/studentPortal';
import { deadlineLabel, employmentTypeLabel, formatDate, formatLpa } from '../../utils/format';

/** Students only see OPEN drives before their deadline; anything else comes back as 404. */
async function loadDrive(driveId) {
  const [drive, profile, applications] = await Promise.all([
    getDrive(driveId).catch((err) => {
      if (err?.status === 404) return null;
      throw err;
    }),
    getStudentProfile(),
    loadMyApplications(),
  ]);
  return { drive, profile, applications };
}

const hostname = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const FACT_BORDERS = ['pr-4', 'border-l pl-4', 'border-t pr-4 md:border-t-0 md:border-l md:pl-4', 'border-l border-t pl-4 md:border-t-0'];

function KeyFacts({ drive }) {
  const facts = [
    {
      label: 'Package',
      value: (
        <span className="text-[22px] font-semibold tracking-[-0.02em]">
          {formatLpa(drive.packageLpa)} <span className="text-[13px] font-medium text-muted">LPA</span>
        </span>
      ),
    },
    { label: 'Location', value: drive.location },
    { label: 'Employment type', value: employmentTypeLabel(drive.employmentType) },
    { label: 'Apply by', value: `${formatDate(drive.deadline, { withYear: false })} · ${deadlineLabel(drive.deadline)}` },
  ];
  return (
    <dl aria-label="Key facts" className="grid grid-cols-2 border-t border-b border-t-ink border-b-line md:grid-cols-4">
      {facts.map((fact, index) => (
        <div key={fact.label} className={`border-line py-4 ${FACT_BORDERS[index]}`}>
          <dt className="eyebrow">{fact.label}</dt>
          <dd className={typeof fact.value === 'string' ? 'mt-2.5 text-base font-medium' : 'mt-2'}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <p role="status" className="sr-only">
        Loading drive…
      </p>
      <div aria-hidden="true" className="flex gap-5">
        <div className="skeleton h-16 w-16 rounded-[10px]" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-9 w-96 max-w-full" />
        </div>
      </div>
      <div aria-hidden="true" className="skeleton h-20 w-full" />
      <div aria-hidden="true" className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-4 w-full" />
          ))}
        </div>
        <div className="skeleton h-80 w-full rounded-[10px]" />
      </div>
    </div>
  );
}

/** One drive: key facts, the role description, the company, and the eligibility / apply panel. */
export default function DriveDetail() {
  const { driveId } = useParams();
  const { data, status, error, reload, setData } = useAsync(() => loadDrive(driveId), [driveId]);
  const [dialog, setDialog] = useState(null); // 'apply' | 'withdraw'
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const drive = data?.drive;
  usePageTitle(status === 'ready' ? (drive?.title ?? 'Drive unavailable') : null);

  if (status === 'loading') return <DetailSkeleton />;
  if (status === 'error') {
    return <ErrorState title="We couldn't load this drive." message={error} onRetry={() => reload()} />;
  }

  const application = applicationsByDrive(data.applications).get(String(driveId));

  if (!drive) {
    return (
      <EmptyState
        title="This drive is no longer available"
        message="It closed or its deadline passed, so it’s no longer shown to students."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/student/drives" className="btn btn-secondary">
              Browse open drives
            </Link>
            {application && (
              <Link to={`/student/applications?application=${application._id}`} className="btn">
                View your application
              </Link>
            )}
          </div>
        }
      />
    );
  }

  const company = drive.companyId ?? {};

  const openDialog = (name) => {
    setActionError('');
    setDialog(name);
  };

  const confirm = async () => {
    setBusy(true);
    setActionError('');
    try {
      if (dialog === 'apply') {
        const result = await applyToDrive(drive._id);
        setData((current) => ({ ...current, applications: [result.application, ...current.applications] }));
        setNotice(result.message || 'Application submitted.');
      } else {
        const result = await withdrawApplication(application._id);
        setData((current) => ({
          ...current,
          applications: current.applications.filter((a) => a._id !== application._id),
        }));
        setNotice(result.message || 'Application withdrawn.');
      }
      setDialog(null);
    } catch (err) {
      setActionError(err.message);
      // The server knows better (e.g. already applied elsewhere in another tab) — resync quietly.
      if (err.status === 409 || err.status === 403) reload({ silent: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-start gap-5">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={64} />
        <div className="flex min-w-60 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <a href="#company" className="text-[15px] text-muted hover:text-ink">
              {company.name}
            </a>
            <StatusBadge status={drive.status} />
          </div>
          <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.035em] md:text-4xl">{drive.title}</h1>
        </div>
      </section>

      <KeyFacts drive={drive} />

      <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="about-role">
            <h2 id="about-role" className="mb-3 text-lg font-semibold">
              About the role
            </h2>
            <p className="prose-body">{drive.description}</p>
          </section>

          <section id="company" aria-labelledby="company-title" className="flex scroll-mt-20 flex-col gap-3 border-t border-line pt-6">
            <span className="eyebrow">Company</span>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 id="company-title" className="text-[17px] font-semibold">
                  {company.name}
                </h2>
                {company.industry && <p className="mt-0.5 text-[13px] text-muted">{company.industry}</p>}
              </div>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] underline underline-offset-2 hover:text-muted"
                >
                  {hostname(company.website)} ↗
                </a>
              )}
            </div>
          </section>
        </div>

        <DriveApplyPanel
          drive={drive}
          profile={data.profile}
          application={application}
          notice={notice}
          onApply={() => openDialog('apply')}
          onWithdraw={() => openDialog('withdraw')}
        />
      </div>

      <ConfirmDialog
        open={dialog === 'apply'}
        title={`Apply to ${company.name ?? 'this drive'}?`}
        confirmLabel="Submit application"
        busy={busy}
        error={actionError}
        onConfirm={confirm}
        onClose={() => setDialog(null)}
      >
        {drive.title} · {lpaLabel(drive.packageLpa)}. Your profile and resume link will be shared with the recruiter. You can
        withdraw from My applications while it’s still APPLIED.
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'withdraw'}
        title="Withdraw your application?"
        confirmLabel="Withdraw"
        cancelLabel="Keep application"
        tone="danger"
        busy={busy}
        error={actionError}
        onConfirm={confirm}
        onClose={() => setDialog(null)}
      >
        Your application to {company.name} for {drive.title} will be deleted and the recruiter will no longer see it.
      </ConfirmDialog>
    </div>
  );
}
