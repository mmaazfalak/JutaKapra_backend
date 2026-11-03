/**
 * Safe fetch utility that guarantees graceful error handling and prevents
 * JSON parse crashes when the server returns HTML (e.g., Vercel 404/500 pages).
 */

const RAW_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://jutakaprabackend.vercel.app' : '')
).trim();
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

/**
 * Resolves API endpoints against the configured VITE_API_BASE_URL.
 * Supports absolute URLs, relative paths, and Vite dev proxy fallback.
 */
export function getApiUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  message?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const headers = new Headers(options?.headers || {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const targetUrl = getApiUrl(url);
    const response = await fetch(targetUrl, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      try {
        const json = await response.json();
        return {
          ok: response.ok,
          status: response.status,
          data: json,
          message: json?.message || json?.error || (response.ok ? 'Success' : `Request failed with status ${response.status}`),
          error: !response.ok ? (json?.error || json?.message || `Request failed (${response.status})`) : undefined,
        };
      } catch (parseError: any) {
        console.warn(`[safeFetchJson] Failed to parse JSON from ${url}:`, parseError);
        return {
          ok: false,
          status: response.status,
          data: null,
          error: 'The server returned an invalid response format. Please try again.',
          message: 'The server returned an invalid response format. Please try again.',
        };
      }
    }

    // Response is NOT JSON (e.g., HTML 404, 502, 500 error page from Vercel / Nginx)
    const text = await response.text().catch(() => '');
    console.warn(`[safeFetchJson] Non-JSON response received from ${url} (status ${response.status}):`, text.slice(0, 150));

    let friendlyError = `Server returned status ${response.status}`;
    if (response.status === 404) {
      friendlyError = 'API endpoint not found. Please verify the service is running.';
    } else if (response.status >= 500) {
      friendlyError = 'The server encountered an error processing your request. Please try again in a few moments.';
    } else if (response.status === 403 || response.status === 401) {
      friendlyError = 'You do not have permission to access this resource. Please log in.';
    }

    return {
      ok: false,
      status: response.status,
      data: null,
      error: friendlyError,
      message: friendlyError,
    };
  } catch (networkError: any) {
    console.error(`[safeFetchJson] Network error for ${url}:`, networkError);
    const errorMsg = networkError?.message || 'Network connection failed. Please check your internet connection.';
    return {
      ok: false,
      status: 0,
      data: null,
      error: errorMsg,
      message: errorMsg,
    };
  }
}
