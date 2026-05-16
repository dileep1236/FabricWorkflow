/**
 * Centralized API client.
 * --------------------------------------------------------------------------
 * Previously every component hardcoded "http://localhost:5000/api/..." and
 * repeated the same fetch + JSON + error boilerplate. This module gives one
 * place to configure the base URL (via env) and one consistent error shape.
 *
 * Usage:
 *   import { api } from '../api/client';
 *   const rows = await api.get('/get-all');
 *   await api.post('/execute-sql', { rows });
 */

const BASE_URL =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal,
    });
  } catch (networkErr) {
    throw new ApiError(
      'Cannot reach the server. Is the backend running?',
      0,
      networkErr,
    );
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text; // some endpoints return plain text
  }

  if (!res.ok) {
    const msg =
      (data && data.error) ||
      (data && data.message) ||
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  ApiError,
  BASE_URL,
};

export { ApiError };
