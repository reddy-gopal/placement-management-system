import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandMark from '../components/layout/BrandMark';
import { ROLE_HOME, useAuth } from '../context/AuthContext';

const AUDIENCE = { STUDENT: 'students', RECRUITER: 'recruiters', ADMIN: 'the placement cell' };

/** 403: signed in, but the route belongs to another role. */
export default function AccessDenied({ requiredRoles = [] }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const audience = requiredRoles.map((role) => AUDIENCE[role]).filter(Boolean).join(' or ');

  const switchAccount = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-6 sm:px-10">
        <Link to={ROLE_HOME[user?.role] ?? '/'} aria-label="NexStep home">
          <BrandMark />
        </Link>
        {user && (
          <span className="text-[13px] text-muted">
            Signed in as <strong className="font-medium text-ink">{user.email}</strong> · {user.role}
          </span>
        )}
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="grid w-full max-w-220 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-center gap-16">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Error 403</span>
            <p aria-hidden="true" className="text-[120px] font-semibold leading-[0.9] tracking-[-0.06em] sm:text-[160px]">
              4
              <span className="relative top-[0.02em] inline-block h-[0.58em] w-[0.58em] rounded-full border-[14px] border-ink bg-lime align-baseline" />
              3
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.03em]">
              {audience ? `This page is for ${audience}.` : 'You don’t have access to this page.'}
            </h1>
            <p className="text-[15px] leading-relaxed text-muted">
              Your account has the <strong className="font-medium text-ink">{user?.role}</strong> role, so you can’t open{' '}
              <code className="rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[13px] text-ink">{pathname}</code>. If you
              think this is a mistake, contact your placement cell.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link className="btn" to={ROLE_HOME[user?.role] ?? '/'}>
                Go to my dashboard
              </Link>
              <button type="button" className="btn btn-secondary" onClick={switchAccount}>
                Sign in with another account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
