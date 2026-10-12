import { useState } from 'react';
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { setToken } from '../adapters/authAdapter.js';
import { Button, Notice } from './ui.jsx';

export default function TokenSetup() {
  const [token, setTokenValue] = useState('');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (token.trim().split('.').length !== 3) {
      setError('Paste a valid recruiter JWT returned by the M1 login or registration endpoint.');
      return;
    }
    setToken(token);
    window.location.reload();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-white">
      <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="relative w-full max-w-lg animate-fade-up rounded-3xl border border-slate-800 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-xl sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-glow">
            <KeyRound size={22} />
          </div>
          <div>
            <p className="text-xl font-black tracking-tight">Connect recruiter session</p>
            <p className="text-sm text-slate-400">Temporary M1 integration bridge</p>
          </div>
        </div>

        <Notice>
          <span className="inline-flex items-start gap-2">
            <ShieldCheck className="mt-0.5 shrink-0" size={17} />
            This screen exists only while the shared M1 login UI is being built. The final integration will provide the token automatically.
          </span>
        </Notice>

        <form onSubmit={submit} className="mt-6">
          <label className="text-sm font-bold text-slate-200" htmlFor="development-token">Recruiter JWT</label>
          <textarea
            id="development-token"
            value={token}
            onChange={(event) => { setTokenValue(event.target.value); setError(''); }}
            rows={5}
            className="mt-2 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
            placeholder="eyJhbGciOiJIUzI1NiIs…"
          />
          {error && <p className="mt-2 text-xs font-medium text-rose-400">{error}</p>}
          <Button type="submit" size="lg" className="mt-5 w-full">
            Enter recruiter portal <ArrowRight size={17} />
          </Button>
        </form>
      </div>
    </main>
  );
}
