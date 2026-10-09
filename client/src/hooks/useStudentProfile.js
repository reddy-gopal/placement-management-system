import { useCallback, useEffect, useState } from 'react';
import { getStudentProfile, saveStudentProfile } from '../services/studentProfileApi';

/**
 * Loads the authenticated student's saved profile and exposes a save action.
 * status: 'loading' | 'ready' | 'error'. `profile` is null when none exists yet.
 */
export default function useStudentProfile() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      setProfile(await getStudentProfile());
      setStatus('ready');
    } catch (err) {
      setLoadError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (payload) => {
    const result = await saveStudentProfile(payload);
    setProfile(result.profile);
    return result;
  }, []);

  return { profile, status, loadError, reload: load, save };
}
