import { Bell, ChevronRight, Menu } from 'lucide-react';
import { getInitials } from '../../utils/profileInsights';

const iconButton =
  'grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-indigo-400 motion-reduce:transition-none';

export default function TopBar({ section, pageTitle, identity, menuButtonRef, drawerOpen, onOpenMenu }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="mobile-navigation"
          className={`${iconButton} -ml-2 lg:hidden`}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1.5 text-sm">
            <li className="text-slate-500 dark:text-slate-400">{section}</li>
            <li aria-hidden="true" className="text-slate-300 dark:text-slate-600">
              <ChevronRight className="h-4 w-4" />
            </li>
            <li aria-current="page" className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {pageTitle}
            </li>
          </ol>
        </nav>

        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Notifications" className={`${iconButton} relative`}>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-50 dark:ring-slate-950"
            />
          </button>
          <span
            role="img"
            aria-label={identity ? `Signed in as ${identity.rollNumber}` : 'Student account'}
            className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs font-semibold text-white ring-2 ring-white dark:ring-slate-900"
          >
            <span aria-hidden="true">{getInitials(identity?.rollNumber)}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
