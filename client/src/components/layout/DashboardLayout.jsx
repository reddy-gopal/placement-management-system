import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { STUDENT_NAV_ITEMS } from './navItems';
import { DashboardIdentityContext } from './dashboardIdentity';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Off-canvas navigation for < lg screens: Escape / backdrop close it, Tab stays inside. */
function MobileDrawer({ open, onClose, identity }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    panel?.querySelector('[data-autofocus]')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="animate-drawer-in absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <Sidebar
          identity={identity}
          onNavigate={onClose}
          headerAction={
            <button
              type="button"
              onClick={onClose}
              data-autofocus
              aria-label="Close navigation"
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          }
        />
      </div>
    </div>
  );
}

/** App shell for student pages: fixed sidebar (≥ lg), off-canvas drawer below, sticky top bar. */
export default function DashboardLayout() {
  const [identity, setIdentity] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const { pathname } = useLocation();

  const current = STUDENT_NAV_ITEMS.find((item) => item.to && pathname.startsWith(item.to));

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    // Return focus to the control that opened the drawer.
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  // Close the drawer if the viewport grows past the lg breakpoint while it is open.
  useEffect(() => {
    if (!drawerOpen || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event) => event.matches && setDrawerOpen(false);
    query.addEventListener?.('change', handleChange);
    return () => query.removeEventListener?.('change', handleChange);
  }, [drawerOpen]);

  return (
    <DashboardIdentityContext.Provider value={setIdentity}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>

        <aside
          aria-label="Sidebar"
          className="fixed inset-y-0 left-0 z-20 hidden w-68 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900/60"
        >
          <Sidebar identity={identity} />
        </aside>

        <MobileDrawer open={drawerOpen} onClose={closeDrawer} identity={identity} />

        <div className="lg:pl-68">
          <TopBar
            section="Student"
            pageTitle={current?.label ?? 'Dashboard'}
            identity={identity}
            menuButtonRef={menuButtonRef}
            drawerOpen={drawerOpen}
            onOpenMenu={() => setDrawerOpen(true)}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto max-w-7xl px-4 pb-16 pt-6 focus:outline-none sm:px-6 sm:pt-8 lg:px-8"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardIdentityContext.Provider>
  );
}
