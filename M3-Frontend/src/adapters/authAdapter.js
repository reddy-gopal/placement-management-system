const TOKEN_KEY = 'nexstep_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token.trim());
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const decodePayload = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

export const getActor = () => {
  const token = getToken();
  const payload = token ? decodePayload(token) : null;
  return {
    email: payload?.email ?? 'Recruiter account',
    role: payload?.role ?? 'RECRUITER'
  };
};
