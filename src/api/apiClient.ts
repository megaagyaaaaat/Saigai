import { APP_CONFIG } from './apiConfig';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  isMock: boolean;
  freshness: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic typed API Client with AbortController, timeout, and graceful error handling.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = APP_CONFIG.requestTimeoutMs, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link external signal if provided
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const url = `${APP_CONFIG.apiBaseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Request failed with status ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result as T;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out or cancelled for ${endpoint}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
