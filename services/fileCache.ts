/**
 * In-memory file cache for viewed/uploaded files (web only).
 * When the user views or uploads a file, we store it by URL so the next view
 * uses the cached blob and does not re-download.
 */

const MAX_ENTRIES = 50

type CacheEntry = { blobUrl: string; blob: Blob; addedAt: number }
const cache = new Map<string, CacheEntry>()

const isWeb =
  typeof globalThis !== 'undefined' &&
  typeof globalThis.URL?.createObjectURL === 'function'

function evictOldest() {
  if (cache.size < MAX_ENTRIES) return
  let oldestKey: string | null = null
  let oldestAt = Infinity
  for (const [key, entry] of cache) {
    if (entry.addedAt < oldestAt) {
      oldestAt = entry.addedAt
      oldestKey = key
    }
  }
  if (oldestKey) {
    const entry = cache.get(oldestKey)
    if (entry?.blobUrl) {
      try {
        globalThis.URL.revokeObjectURL(entry.blobUrl)
      } catch {
        // ignore
      }
    }
    cache.delete(oldestKey)
  }
}

/**
 * Store a blob for the given URL (e.g. after upload). Returns the blob URL to use for display.
 * On non-web or if blob APIs are missing, returns a data URL or the original url (caller should use original url).
 */
export function setCachedFile(url: string, blob: Blob): string {
  if (!url || !isWeb) return url
  try {
    const blobUrl = globalThis.URL.createObjectURL(blob)
    evictOldest()
    cache.set(url, { blobUrl, blob, addedAt: Date.now() })
    return blobUrl
  } catch {
    return url
  }
}

export type GetViewableUrlOptions = {
  getAuthToken?: () => Promise<string | null>
}

/**
 * Returns a URL suitable for display (img/iframe/WebView).
 * If the file is in cache, returns the cached blob URL so it is not re-downloaded.
 * Otherwise fetches the URL, caches the blob, and returns the new blob URL.
 * On non-web, returns the original url unchanged.
 */
export async function getViewableUrl(
  url: string,
  options?: GetViewableUrlOptions,
): Promise<string> {
  const u = (url ?? '').trim()
  if (!u) return u

  if (!isWeb) return u

  const existing = cache.get(u)
  if (existing) {
    return existing.blobUrl
  }

  try {
    const token = options?.getAuthToken ? await options.getAuthToken() : null
    const res = await fetch(u, {
      method: 'GET',
      credentials: 'omit',
      headers:
        token && !u.startsWith('blob:') && !u.startsWith('data:')
          ? { Authorization: `Bearer ${token}` }
          : undefined,
    })
    if (!res.ok) return u
    const blob = await res.blob()
    const blobUrl = setCachedFile(u, blob)
    return blobUrl === u ? u : blobUrl
  } catch {
    return u
  }
}
