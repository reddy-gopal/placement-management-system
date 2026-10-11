import { NavLink } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import BrandMark from './BrandMark';
import { STUDENT_NAV_ITEMS } from './navItems';
import { getInitials } from '../../utils/profileInsights';

const itemBase =
  'group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none';

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;

  if (!item.to) {
    return (
      <li>
        <span aria-disabled="true" className={`${itemBase} cursor-not-allowed text-slate-500 dark:text-slate-500`}>
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Soon
          </span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.to}
        onClick={onNavigate}
        className={({ isActive }) =>
          [
            itemBase,
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400',
            isActive
              ? 'bg-indigo-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgb(99_102_241/0.15)] dark:bg-indigo-500/10 dark:text-indigo-300 dark:shadow-[inset_0_0_0_1px_rgb(129_140_248/0.2)]'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100',
          ].join(' ')
        }
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </NavLink>
    </li>
  );
}

function IdentityBlock({ identity }) {
  if (!identity) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/[0.07]">
        <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Tip</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          Recruiters filter by CGPA, backlogs and skills. A complete profile unlocks more drives.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
      <span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
      >
        {getInitials(identity.rollNumber)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{identity.rollNumber}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          Student{identity.branch ? ` · ${identity.branch}` : ''}
          {identity.graduationYear ? ` · ${identity.graduationYear}` : ''}
        </p>
      </div>
    </div>
  );
}

/** Sidebar contents, shared by the fixed desktop rail and the mobile drawer. */
export default function Sidebar({ identity, onNavigate, headerAction }) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-5">
      <div className="flex items-center justify-between px-1">
        <BrandMark />
        {headerAction}
      </div>

      <nav aria-label="Student" className="flex-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menu</p>
        <ul className="space-y-1">
          {STUDENT_NAV_ITEMS.map((item) => (
            <NavItem key={item.label} item={item} onNavigate={onNavigate} />
          ))}
        </ul>
      </nav>

      <IdentityBlock identity={identity} />
    </div>
  );
}
