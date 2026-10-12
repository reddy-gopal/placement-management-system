import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

/** Sticky breadcrumb bar: "Section / Parent / Page". `trail` = [{ label, to? }]. */
export default function TopBar({ trail, menuButtonRef, drawerOpen, onOpenMenu }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex min-h-13.25 items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-10">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="mobile-navigation"
          className="-ml-2 grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-subtle hover:text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-2 text-[13px] text-muted">
            {trail.map((crumb, index) => {
              const last = index === trail.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className={`flex min-w-0 items-center gap-2 ${last ? '' : 'shrink-0'}`}>
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {last ? (
                    <span aria-current="page" className="truncate font-medium text-ink">
                      {crumb.label}
                    </span>
                  ) : crumb.to ? (
                    <Link to={crumb.to} className="hover:text-ink">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </header>
  );
}
