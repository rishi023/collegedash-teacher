/**
 * Persist and resolve paths of downloaded PDFs (native only).
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy'

const DOWNLOADS_KEY = 'app_downloads'

export type DownloadEntry = {
  url: string
  localUri: string
  title?: string
  downloadedAt: number
}

type DownloadsMap = Record<string, DownloadEntry>

async function getDownloadsMap(): Promise<DownloadsMap> {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DownloadsMap
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

async function setDownloadsMap(map: DownloadsMap): Promise<void> {
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(map))
}

export async function getDownloadPath(url: string): Promise<string | null> {
  const map = await getDownloadsMap()
  const entry = map[url]
  if (!entry?.localUri) return null
  try {
    const info = await FileSystem.getInfoAsync(entry.localUri)
    if (info.exists) return entry.localUri
    await removeDownload(url)
    return null
  } catch {
    return null
  }
}

export async function saveDownload(
  url: string,
  localUri: string,
  title?: string,
): Promise<void> {
  const map = await getDownloadsMap()
  map[url] = { url, localUri, title, downloadedAt: Date.now() }
  await setDownloadsMap(map)
}

export async function removeDownload(url: string): Promise<void> {
  const map = await getDownloadsMap()
  delete map[url]
  await setDownloadsMap(map)
}

export async function getAllDownloads(): Promise<DownloadEntry[]> {
  const map = await getDownloadsMap()
  const entries = Object.values(map)
  const existing: DownloadEntry[] = []
  for (const e of entries) {
    try {
      const info = await FileSystem.getInfoAsync(e.localUri)
      if (info.exists) existing.push(e)
      else await removeDownload(e.url)
    } catch {
      await removeDownload(e.url)
    }
  }
  return existing.sort((a, b) => b.downloadedAt - a.downloadedAt)
}
