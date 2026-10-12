import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/authApi';
import { useOptionalAuth } from '../context/AuthContext';

/**
 * The signed-in user's account details (name, email, role), or null while
 * loading or if they can't be fetched. Uses the session's user when there is one;
 * otherwise fetches it. Purely informational, so failures are silent.
 */
export default function useCurrentUser() {
  const sessionUser = useOptionalAuth()?.user ?? null;
  const [fetchedUser, setFetchedUser] = useState(null);

  useEffect(() => {
    if (sessionUser) return undefined;
    let cancelled = false;
    getCurrentUser()
      .then((result) => !cancelled && setFetchedUser(result ?? null))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  return sessionUser ?? fetchedUser;
}
