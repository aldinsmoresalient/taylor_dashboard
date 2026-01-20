/**
 * Fetch utility with timeout, retry logic, caching, and improved error handling
 */

import { apiCache, createCacheKey } from './cache';

export interface FetchOptions extends Omit<RequestInit, 'cache'> {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public isTimeout: boolean = false,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic, timeout, caching, and improved error handling
 */
export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    useCache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    ...fetchOptions
  } = options;

  // Check cache first (only for GET requests)
  const method = fetchOptions.method?.toUpperCase() || 'GET';
  const cacheKey = createCacheKey(url);

  if (useCache && method === 'GET') {
    const cached = apiCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, { ...fetchOptions, timeout });

      if (!response.ok) {
        // Don't retry on client errors (4xx), only on server errors (5xx)
        if (response.status >= 400 && response.status < 500) {
          throw new FetchError(
            `Request failed with status ${response.status}`,
            response.status
          );
        }

        // Retry on server errors with exponential backoff
        if (attempt < retries) {
          await sleep(retryDelay * Math.pow(2, attempt)); // True exponential: 1s, 2s, 4s
          continue;
        }

        throw new FetchError(
          `Request failed with status ${response.status}`,
          response.status
        );
      }

      const data = await response.json();

      // Cache successful response
      if (useCache && method === 'GET') {
        apiCache.set(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error) {
      lastError = error as Error;

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new FetchError('Request timed out', undefined, true);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < retries) {
          await sleep(retryDelay * Math.pow(2, attempt)); // True exponential backoff
          continue;
        }
        throw new FetchError('Network error - please check your connection', undefined, false, true);
      }

      // Re-throw FetchError
      if (error instanceof FetchError) {
        throw error;
      }

      // Retry on other errors with exponential backoff
      if (attempt < retries) {
        await sleep(retryDelay * Math.pow(2, attempt));
        continue;
      }
    }
  }

  throw lastError || new FetchError('Request failed after retries');
}

/**
 * Format error message for display
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    if (error.isTimeout) {
      return 'Request timed out. Please try again.';
    }
    if (error.isNetworkError) {
      return 'Network error. Please check your connection.';
    }
    if (error.status === 404) {
      return 'Data not found.';
    }
    if (error.status && error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
