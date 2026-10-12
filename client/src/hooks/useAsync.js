import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `load` on mount and whenever `deps` change.
 * Returns { data, status: 'loading' | 'ready' | 'error', error, reload, setData }.
 * `reload({ silent: true })` refetches without flipping back to the loading state.
 */
export default function useAsync(load, deps = []) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const loadRef = useRef(load);
  loadRef.current = load;
  const requestId = useRef(0);

  const run = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current;
    if (!silent) setStatus('loading');
    setError('');
    try {
      const result = await loadRef.current();
      if (id !== requestId.current) return;
      setData(result);
      setStatus('ready');
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, status, error, reload: run, setData };
}
