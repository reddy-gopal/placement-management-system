import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Sun,
  X
} from 'lucide-react';
import { clearToken, getActor } from '../adapters/authAdapter.js';

const navItems = [
  { to: '/recruiter/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/recruiter/drives', label: 'Placement drives', icon: BriefcaseBusiness },
  { to: '/recruiter/company', label: 'Company profile', icon: Building2 }
];

const NavItems = ({ onNavigate }) => navItems.map(({ to, label, icon: Icon }) => (
  <NavLink
    key={to}
    to={to}
    onClick={onNavigate}
    className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <Icon size={18} />
    <span>{label}</span>
    <ChevronRight size={14} className="ml-auto opacity-0 transition group-hover:opacity-70" />
  </NavLink>
));

export default function AppShell() {
  const actor = getActor();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('nexstep_theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('nexstep_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const logout = () => {
    clearToken();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-500/20">N</div>
          <div>
            <p className="font-black tracking-tight text-white">NexStep</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recruiter portal</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1.5" aria-label="Recruiter navigation">
          <NavItems />
        </nav>

        <NavLink
          to="/recruiter/drives/new"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-indigo-50 focus-visible:ring-4 focus-visible:ring-indigo-500/30"
        >
          <Plus size={17} /> Post new drive
        </NavLink>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-xs font-black text-indigo-300">RC</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">Recruiter</p>
              <p className="truncate text-[11px] text-slate-500">{actor.email}</p>
            </div>
            <button onClick={logout} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-rose-300" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <span className="font-black tracking-tight">NexStep</span>
        </div>
        <button onClick={() => setDark((value) => !value)} className="rounded-xl border bg-white p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300" aria-label="Toggle color theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />
          <aside className="relative h-full w-[86%] max-w-xs bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-black text-white">N</div>
                <span className="font-black text-white">NexStep</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800" aria-label="Close navigation">
                <X size={20} />
              </button>
            </div>
            <nav className="mt-8 space-y-1.5"><NavItems onNavigate={() => setMobileOpen(false)} /></nav>
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <div className="hidden h-16 items-center justify-end border-b border-slate-200/80 bg-white/75 px-8 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/75 lg:flex">
          <button onClick={() => setDark((value) => !value)} className="rounded-xl border bg-white p-2.5 text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300" aria-label="Toggle color theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <main className="ambient-grid min-h-[calc(100vh-4rem)] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
