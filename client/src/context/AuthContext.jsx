import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../services/authApi';
import { UNAUTHORIZED_EVENT } from '../services/apiClient';
import { clearAuthToken, getAuthToken, setAuthToken } from '../services/authToken';

const AuthContext = createContext(null);

/** Where each role lands after signing in. */
export const ROLE_HOME = {
  STUDENT: '/student',
  RECRUITER: '/recruiter',
  ADMIN: '/admin',
};

/**
 * Holds the signed-in user. status: 'loading' (checking a stored token) | 'authenticated' | 'anonymous'.
 * `sessionExpired` is set when the server rejected the token mid-session.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (getAuthToken() ? 'loading' : 'anonymous'));
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (status !== 'loading') return undefined;
    let cancelled = false;
    authApi
      .getCurrentUser()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        clearAuthToken();
        setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthToken();
      setUser(null);
      setSessionExpired(true);
      setStatus('anonymous');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const startSession = useCallback(({ token, user: nextUser }) => {
    setAuthToken(token);
    setUser(nextUser);
    setSessionExpired(false);
    setStatus('authenticated');
    return nextUser;
  }, []);

  const login = useCallback(async (credentials) => startSession(await authApi.login(credentials)), [startSession]);
  const signup = useCallback(async (details) => startSession(await authApi.signup(details)), [startSession]);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setSessionExpired(false);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({ user, status, sessionExpired, login, signup, logout }),
    [user, status, sessionExpired, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

/** Same as useAuth, but returns null outside a provider (lets components render in isolated tests). */
export function useOptionalAuth() {
  return useContext(AuthContext);
}
