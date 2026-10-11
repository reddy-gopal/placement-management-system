import { Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Recruiter UI render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-rose-900/60 bg-slate-900 p-8 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
            <AlertTriangle size={22} />
          </div>
          <h1 className="mt-5 text-2xl font-black">Recruiter workspace could not load</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{this.state.error.message}</p>
          <button onClick={() => window.location.reload()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold transition hover:bg-indigo-500">
            <RefreshCcw size={16} /> Reload workspace
          </button>
        </div>
      </main>
    );
  }
}
