/**
 * GeneLab — Resilient Scientific API Client
 * Features rate-limiting, in-memory caching, exponential backoff,
 * timeout controls, and unified error handling.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface ApiClientOptions {
  timeoutMs?: number;
  cacheTtlMs?: number; // default 10 minutes
  retries?: number;
  skipCache?: boolean;
  signal?: AbortSignal;
}

export type ApiProvider =
  | 'ncbi'
  | 'pubmed'
  | 'pubchem'
  | 'uniprot'
  | 'ensembl'
  | 'rcsb'
  | 'string'
  | 'reactome'
  | 'europepmc';

// Minimum interval between requests (in ms) per scientific API provider
const PROVIDER_RATE_LIMITS: Record<ApiProvider, number> = {
  ncbi: 350,      // ~2.8 req/sec (NCBI limit without API key is 3 req/sec)
  pubmed: 350,    // NCBI E-utilities
  pubchem: 220,   // ~4.5 req/sec (PubChem limit is 5 req/sec)
  uniprot: 150,   // ~6.6 req/sec
  ensembl: 100,   // ~10 req/sec (Ensembl limit is 15 req/sec)
  rcsb: 150,      // ~6.6 req/sec
  string: 200,    // ~5 req/sec
  reactome: 150,  // ~6.6 req/sec
  europepmc: 150, // ~6.6 req/sec
};

class RateLimiter {
  private lastRequestTime: Record<string, number> = {};

  async throttle(provider: ApiProvider): Promise<void> {
    const minInterval = PROVIDER_RATE_LIMITS[provider] || 200;
    const now = Date.now();
    const lastTime = this.lastRequestTime[provider] || 0;
    const elapsed = now - lastTime;

    if (elapsed < minInterval) {
      const waitTime = minInterval - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime[provider] = Date.now();
  }
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxEntries = 150;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs = 10 * 60 * 1000): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class ScientificApiError extends Error {
  constructor(
    message: string,
    public provider: ApiProvider,
    public status?: number,
    public isRetryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'ScientificApiError';
  }
}

const rateLimiter = new RateLimiter();
const apiCache = new ApiCache();

export async function fetchWithRetry<T>(
  url: string,
  provider: ApiProvider,
  options: ApiClientOptions = {},
  headers: Record<string, string> = {}
): Promise<T> {
  const {
    timeoutMs = 12000,
    cacheTtlMs = 10 * 60 * 1000,
    retries = 2,
    skipCache = false,
    signal,
  } = options;

  const cacheKey = `${provider}:${url}`;

  // 1. Check cache
  if (!skipCache) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  let attempt = 0;
  let delay = 600;

  while (attempt <= retries) {
    try {
      // Throttle request according to provider rate limits
      await rateLimiter.throttle(provider);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Link external abort signal if provided
      const combinedSignal = signal
        ? (AbortSignal as any).any
          ? (AbortSignal as any).any([signal, controller.signal])
          : controller.signal
        : controller.signal;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json, text/plain, */*',
          ...headers,
        },
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const status = response.status;
        const isRetryable = status === 429 || (status >= 500 && status <= 504);

        if (status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, waitTime));
            attempt++;
            continue;
          }
        }

        let errBody = '';
        try {
          errBody = await response.text();
        } catch {
          // Ignore
        }

        if (isRetryable && attempt < retries) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          attempt++;
          continue;
        }

        throw new ScientificApiError(
          `API ${provider.toUpperCase()} returned HTTP ${status}: ${response.statusText}`,
          provider,
          status,
          isRetryable,
          errBody.substring(0, 300)
        );
      }

      // Check response content type
      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Cache valid response
      if (!skipCache && data) {
        apiCache.set(cacheKey, data, cacheTtlMs);
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ScientificApiError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new ScientificApiError(
          `Request to ${provider.toUpperCase()} timed out after ${timeoutMs}ms.`,
          provider,
          408,
          true
        );
      }

      // Network failures (e.g. offline, DNS)
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        attempt++;
        continue;
      }

      throw new ScientificApiError(
        `Network connection to ${provider.toUpperCase()} failed: ${err.message || 'Unknown network error'}. Verify internet connectivity.`,
        provider,
        0,
        true,
        err
      );
    }
  }

  throw new ScientificApiError(
    `Failed to fetch from ${provider.toUpperCase()} after ${retries + 1} attempts.`,
    provider,
    0,
    false
  );
}

export function getApiCacheMetrics(): { size: number } {
  return { size: apiCache.size() };
}

export function clearApiCache(): void {
  apiCache.clear();
}
