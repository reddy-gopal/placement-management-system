// Single place that knows where the JWT lives.
// TODO(M1): swap for the auth context/store when the login module lands.
const TOKEN_KEY = 'nexstep_token';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
