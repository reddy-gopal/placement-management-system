import { apiRequest, ApiError, NETWORK_ERROR_MESSAGE, SESSION_ERROR_MESSAGE } from './apiClient';

const jsonResponse = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('apiRequest', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  it('attaches the bearer token and JSON body', async () => {
    localStorage.setItem('nexstep_token', 'abc.def.ghi');
    fetch.mockResolvedValue(jsonResponse(200, { success: true, profile: null }));

    await apiRequest('/student/profile', { method: 'POST', body: { cgpa: 8 } });

    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('/api/v1/student/profile');
    expect(options.headers.Authorization).toBe('Bearer abc.def.ghi');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe('{"cgpa":8}');
  });

  it('maps network failures to a friendly message', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiRequest('/x')).rejects.toMatchObject({ message: NETWORK_ERROR_MESSAGE, status: 0 });
  });

  it('surfaces server validation messages and field errors', async () => {
    fetch.mockResolvedValue(
      jsonResponse(400, { success: false, message: 'CGPA must be between 0 and 10.', errors: { cgpa: 'x' } })
    );
    const error = await apiRequest('/x').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: 'CGPA must be between 0 and 10.', errors: { cgpa: 'x' } });
  });

  it('turns a 401 into a "please log in" message', async () => {
    fetch.mockResolvedValue(jsonResponse(401, { success: false, message: 'Authentication required' }));
    await expect(apiRequest('/x')).rejects.toMatchObject({ status: 401, message: SESSION_ERROR_MESSAGE });
  });

  it('falls back to a generic message when the body is not JSON', async () => {
    fetch.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('bad json'); } });
    await expect(apiRequest('/x')).rejects.toMatchObject({ status: 502, message: 'Something went wrong. Please try again.' });
  });
});
