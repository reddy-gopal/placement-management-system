import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { NAV, findNavItem } from './navItems';
import { LayoutContext } from './dashboardIdentity';
import { useOptionalAuth } from '../../context/AuthContext';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Off-canvas navigation for < lg screens: Escape / backdrop close it, Tab stays inside. */
function MobileDrawer({ open, onClose, children }) {
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
      <div className="animate-fade-in absolute inset-0 bg-ink/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="animate-drawer-in absolute inset-y-0 left-0 w-62 max-w-[85vw] border-r border-line bg-white"
      >
        {children}
      </div>
    </div>
  );
}

/** Phone tab bar (< md), as in the mobile screens: 4 destinations, lime marker on the active one. */
function TabBar({ nav }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {nav.items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              isActive ? 'text-ink' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden="true"
                className={`h-1 w-5 rounded-sm ${isActive ? 'bg-lime shadow-[0_0_0_1px_#111]' : ''}`}
              />
              {item.short}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * App shell for every signed-in portal: fixed 248px sidebar (≥ lg), off-canvas drawer below,
 * sticky breadcrumb bar, and a bottom tab bar on phones. `role` picks the navigation;
 * it defaults to the signed-in user's role.
 */
export default function DashboardLayout({ role }) {
  const auth = useOptionalAuth();
  const navigate = useNavigate();
  const nav = NAV[role ?? auth?.user?.role] ?? NAV.STUDENT;
  const [identity, setIdentity] = useState(null);
  const [pageTitle, setPageTitle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const { pathname } = useLocation();

  const current = findNavItem(nav.items, pathname);
  const trail = [{ label: nav.label, to: nav.items[0].to }];
  if (current && current !== nav.items[0] && pageTitle) trail.push({ label: current.label, to: current.to });
  trail.push({ label: pageTitle ?? current?.label ?? nav.items[0].label });

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    // Return focus to the control that opened the drawer.
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  const signOut = auth
    ? () => {
        auth.logout();
        navigate('/login', { replace: true });
      }
    : undefined;

  // Close the drawer if the viewport grows past the lg breakpoint while it is open.
  useEffect(() => {
    if (!drawerOpen || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event) => event.matches && setDrawerOpen(false);
    query.addEventListener?.('change', handleChange);
    return () => query.removeEventListener?.('change', handleChange);
  }, [drawerOpen]);

  const layoutContext = useMemo(() => ({ setIdentity, setPageTitle }), []);
  const sidebarProps = { nav, user: auth?.user, identity, onSignOut: signOut };

  return (
    <LayoutContext.Provider value={layoutContext}>
      <div className="min-h-screen bg-white text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>

        <aside aria-label="Sidebar" className="fixed inset-y-0 left-0 z-20 hidden w-62 border-r border-line bg-white lg:block">
          <Sidebar {...sidebarProps} />
        </aside>

        <MobileDrawer open={drawerOpen} onClose={closeDrawer}>
          <Sidebar
            {...sidebarProps}
            onNavigate={closeDrawer}
            headerAction={
              <button
                type="button"
                onClick={closeDrawer}
                data-autofocus
                aria-label="Close navigation"
                className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-subtle hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            }
          />
        </MobileDrawer>

        <div className="lg:pl-62">
          <TopBar trail={trail} menuButtonRef={menuButtonRef} drawerOpen={drawerOpen} onOpenMenu={() => setDrawerOpen(true)} />
          <main
            id="main-content"
            tabIndex={-1}
            className="w-full max-w-300 px-4 pb-24 pt-6 focus:outline-none sm:px-6 sm:pt-8 md:pb-18 lg:px-10 lg:pt-10"
          >
            <Outlet />
          </main>
        </div>

        <TabBar nav={nav} />
      </div>
    </LayoutContext.Provider>
  );
}
