import { getAuthToken } from './authToken';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');

export const NETWORK_ERROR_MESSAGE = 'Unable to connect to the server. Please try again.';
export const SESSION_ERROR_MESSAGE = 'You are not logged in or your session has expired. Please log in again.';

export class ApiError extends Error {
  constructor(message, { status = 0, errors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors; // field -> message, when the server returns validation details
  }
}

/**
 * Thin fetch wrapper: attaches the JWT, sends/parses JSON and normalizes
 * every failure into an ApiError with a user-presentable message.
 */
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data || data.success === false) {
    if (response.status === 401) {
      // The server's wording ("Authentication required") doesn't tell students what to do.
      throw new ApiError(SESSION_ERROR_MESSAGE, { status: 401 });
    }
    const fallback =
      response.status === 403
        ? 'You do not have permission to perform this action.'
        : 'Something went wrong. Please try again.';
    throw new ApiError(data?.message || fallback, {
      status: response.status,
      errors: data?.errors || null,
    });
  }

  return data;
}
