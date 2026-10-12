import { Link, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  FileText,
  User,
  Sun,
  Moon,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useStudent } from '../../context/StudentContext.jsx';

export const Navbar = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { student, isLiveMode } = useStudent();
  const location = useLocation();

  const navLinks = [
    { label: 'Drives Catalog', path: '/student/drives', icon: Briefcase },
    { label: 'My Applications', path: '/student/applications', icon: FileText, disabled: false },
    { label: 'Profile', path: '/student/profile', icon: User, disabled: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/student/drives" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  NexStep
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  M4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Campus Placement Portal
              </p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] font-semibold text-slate-300">
            <Shield className="w-3 h-3 text-indigo-400" />
            <span>Student Portal</span>
          </span>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Student Profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs flex items-center justify-center">
              {student?.name ? student.name[0] : 'S'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-white leading-none">
                {student?.name || 'Student'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none font-mono">
                {student?.branch || 'CSE'} • {student?.cgpa || 7.5} CGPA
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
