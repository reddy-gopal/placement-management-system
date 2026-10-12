import { Link, NavLink } from 'react-router-dom';
import BrandMark from './BrandMark';
import { getDisplayInitials } from '../../utils/profileInsights';

const ROLE_SUBTITLE = { STUDENT: 'Student', RECRUITER: 'Recruiter', ADMIN: 'Placement officer' };

function AccountBlock({ user, identity, onSignOut }) {
  const name = user?.name || identity?.name || identity?.rollNumber;
  if (!name) return null;
  const subtitle = identity?.subtitle || identity?.rollNumber || ROLE_SUBTITLE[user?.role] || '';

  return (
    <div className="flex items-center gap-2.5 border-t border-line p-3">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white"
      >
        {getDisplayInitials({ name, rollNumber: identity?.rollNumber })}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">{name}</p>
        {subtitle && subtitle !== name && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
      {onSignOut && (
        <button type="button" onClick={onSignOut} className="shrink-0 text-xs text-muted hover:text-ink">
          Sign out
        </button>
      )}
    </div>
  );
}

/** Sidebar contents, shared by the fixed desktop rail and the mobile drawer. */
export default function Sidebar({ nav, user, identity, onNavigate, onSignOut, headerAction }) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <div className="flex items-center justify-between px-3 py-1.5">
        <Link to={nav.items[0].to} onClick={onNavigate} aria-label="NexStep home">
          <BrandMark />
        </Link>
        {headerAction}
      </div>

      <nav aria-label={nav.label} className="-mt-3 flex-1">
        <p className="eyebrow px-3 pb-3">{nav.label}</p>
        <ul className="flex flex-col gap-0.5">
          {nav.items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span className="nav-dot" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <AccountBlock user={user} identity={identity} onSignOut={onSignOut} />
    </div>
  );
}
