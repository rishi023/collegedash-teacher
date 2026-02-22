/**
 * Download a PDF from a URL to app storage (native only).
 */
import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import { saveDownload } from './downloadStorage'

const DOWNLOADS_DIR = 'downloads'

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'document'
}

function filenameFromUrl(url: string, title?: string): string {
  const base = title ? sanitizeFilename(title) : url.split('/').pop()?.split('?')[0] || 'document'
  const name = base.endsWith('.pdf') ? base : `${base}.pdf`
  return `${Date.now()}_${name}`
}

export async function downloadPdf(
  url: string,
  title?: string,
  getToken?: () => Promise<string | null>,
): Promise<string | null> {
  if (Platform.OS === 'web') return null
  const dir = FileSystem.documentDirectory
  if (!dir) return null

  const dirUri = `${dir}${DOWNLOADS_DIR}/`
  try {
    const { exists } = await FileSystem.getInfoAsync(dirUri)
    if (!exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true })
    }
  } catch {
    return null
  }

  const filename = filenameFromUrl(url, title)
  const fileUri = `${dirUri}${filename}`

  try {
    const token = getToken ? await getToken() : null
    const result = await FileSystem.downloadAsync(url, fileUri, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (result.status !== 200) return null
    await saveDownload(url, result.uri, title)
    return result.uri
  } catch {
    return null
  }
}
