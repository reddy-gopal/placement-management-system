import { GraduationCap, Code, Cpu, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-900 bg-slate-950/90 text-slate-400 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">NexStep Placement Management System</p>
              <p className="text-xs text-slate-500">
                Automated Campus Placement & Eligibility Engine (Sprint Architecture)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Member 4 Slice: <strong className="text-slate-300">Drives Catalog & Eligibility Engine</strong></span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} NexStep Engineering Team • University Campus Placement Portal
        </div>
      </div>
    </footer>
  );
};
