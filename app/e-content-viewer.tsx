import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  ContentStatus,
  getContentBySection,
  publishContent,
  unpublishContent,
  type EContent,
} from '@/services/eContentApi'
import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const WebViewNative =
  Platform.OS !== 'web'
    ? require('react-native-webview').WebView
    : null

const DEFAULT_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.5; color: #1a1a1a; padding: 16px; margin: 0; }
    img { max-width: 100%; height: auto; } a { color: #0ea5e9; }
    pre, code { background: #f1f5f9; padding: 8px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body><p>No content to display.</p></body>
</html>
`

function isVideoUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const u = url.trim().toLowerCase()
  return (
    u.includes('youtube.com') ||
    u.includes('youtu.be') ||
    u.includes('loom.com') ||
    u.includes('drive.google.com') ||
    u.includes('vimeo.com') ||
    u.includes('dailymotion.com') ||
    u.includes('wistia.com')
  )
}

function getEmbedVideoUrl(url: string): string {
  const raw = url.trim()
  const ytMatch = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?playsinline=1`
  const loomMatch = raw.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i)
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`
  const driveMatch = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i)
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  const driveOpenMatch = raw.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i)
  if (driveOpenMatch) return `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`
  const vimeoMatch = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return raw
}

export default function EContentViewerScreen() {
  const { contentId, sectionId, title } = useLocalSearchParams<{
    contentId: string
    sectionId: string
    title: string
  }>()
  const [contentItem, setContentItem] = useState<EContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishLoading, setPublishLoading] = useState(false)

  const fetchContent = useCallback(async () => {
    const sid = sectionId?.trim()
    const cid = contentId?.trim()
    if (!sid || !cid) {
      setError('Missing section or content')
      setLoading(false)
      return
    }
    try {
      const res = await getContentBySection(sid)
      const list = res?.responseObject ?? []
      const found = list.find((c: EContent) => c.id === cid)
      setContentItem(found ?? null)
      if (!found) setError('Content not found')
    } catch (e) {
      console.error(e)
      setError('Failed to load content')
      setContentItem(null)
    } finally {
      setLoading(false)
    }
  }, [sectionId, contentId])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchContent()
  }, [fetchContent])

  const contentUrl = (contentItem?.contentUrl ?? contentItem?.fileUrl ?? '').trim()
  const contentHtml = contentItem?.content?.trim()
  const contentType = (contentItem?.contentType ?? '').toLowerCase()
  const isVideo =
    contentType === 'video' || (!!contentUrl && isVideoUrl(contentUrl))
  const isPdf =
    !isVideo &&
    (contentType === 'pdf' ||
      (contentUrl ? (contentUrl.split('?')[0]?.toLowerCase() ?? '').endsWith('.pdf') : false))

  const videoEmbedUrl = contentUrl && isVideo ? getEmbedVideoUrl(contentUrl) : null
  const viewerUrl =
    contentUrl && isPdf
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(contentUrl)}&embedded=true`
      : contentUrl

  const isDark = useThemeColor({}, 'text') === '#e5e5e5' || useThemeColor({}, 'text') === '#e5e7eb'
  const bodyStyle = isDark
    ? `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.5; color: #e5e5e5; padding: 16px; margin: 0; background: #1a1a1a; }
       img { max-width: 100%; height: auto; } a { color: #0ea5e9; } pre, code { background: #f1f5f9; padding: 8px; border-radius: 6px; }`
    : `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.5; color: #1a1a1a; padding: 16px; margin: 0; background: #fff; }
       img { max-width: 100%; height: auto; } a { color: #0ea5e9; } pre, code { background: #f1f5f9; padding: 8px; border-radius: 6px; }`

  const htmlContent = contentHtml
    ? `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /><style>${bodyStyle}</style></head><body><div class="econtent-body">${contentHtml}</div></body></html>`
    : (isVideo ? '<!DOCTYPE html><html><head></head><body></body></html>' : DEFAULT_HTML)

  const videoEmbedHtml = videoEmbedUrl
    ? `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>*{margin:0;padding:0} html,body{width:100%;height:100%;background:#000} .w{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:8px} .w iframe{width:100%;height:100%;border:none}</style></head><body><div class="w"><iframe src="${videoEmbedUrl.replace(/"/g, '&quot;')}" allowfullscreen></iframe></div></body></html>`
    : null

  const source = useMemo(() => {
    if (videoEmbedHtml && isVideo) return { html: videoEmbedHtml, baseUrl: 'https://app.local/' }
    if (viewerUrl) return { uri: viewerUrl }
    return { html: htmlContent, baseUrl: 'https://app.local/' }
  }, [videoEmbedHtml, isVideo, viewerUrl, htmlContent])

  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBg = useThemeColor({}, 'card')
  const mutedColor = useThemeColor({}, 'muted')
  const textColor = useThemeColor({}, 'text')
  const successColor = useThemeColor({}, 'success')

  const isPublished = contentItem?.status === ContentStatus.PUBLISHED
  const handlePublishToggle = useCallback(async () => {
    if (!contentItem?.id || publishLoading) return
    setPublishLoading(true)
    try {
      const res = isPublished
        ? await unpublishContent(contentItem.id)
        : await publishContent(contentItem.id)
      if (res?.responseObject) setContentItem(res.responseObject as EContent)
      else await fetchContent()
    } catch (e) {
      console.error(e)
    } finally {
      setPublishLoading(false)
    }
  }, [contentItem?.id, contentItem?.status, isPublished, publishLoading, fetchContent])

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !contentItem) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <View style={styles.centered}>
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            {error ?? 'Content not found'}
          </ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  // LINK type without embed: open in browser
  if (contentType === 'link' && contentUrl && !isVideo && !isPdf) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <View style={[styles.publishBar, { backgroundColor: cardBg }]}>
          <ThemedText style={[styles.publishBarLabel, { color: mutedColor }]}>
            {isPublished ? 'Published' : 'Draft'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.publishBarButton, { backgroundColor: isPublished ? mutedColor : successColor }]}
            onPress={handlePublishToggle}
            disabled={publishLoading}
          >
            {publishLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.publishBarButtonText}>
                {isPublished ? 'Unpublish' : 'Publish'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ThemedText style={[styles.linkPrompt, { color: textColor }]}>
            Open link in browser?
          </ThemedText>
          <ThemedText style={[styles.linkUrl, { color: primaryColor }]} numberOfLines={3}>
            {contentUrl}
          </ThemedText>
          <ThemedText
            style={[styles.openLink, { color: primaryColor }]}
            onPress={() => Linking.openURL(contentUrl)}
          >
            Open Link
          </ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  if (Platform.OS === 'web') {
    const iframeSrc = isVideo && videoEmbedUrl ? videoEmbedUrl : viewerUrl || undefined
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <View style={[styles.publishBar, { backgroundColor: cardBg }]}>
          <ThemedText style={[styles.publishBarLabel, { color: mutedColor }]}>
            {isPublished ? 'Published' : 'Draft'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.publishBarButton, { backgroundColor: isPublished ? mutedColor : successColor }]}
            onPress={handlePublishToggle}
            disabled={publishLoading}
          >
            {publishLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.publishBarButtonText}>
                {isPublished ? 'Unpublish' : 'Publish'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.webWrap}>
          <iframe
            src={iframeSrc}
            srcDoc={iframeSrc ? undefined : htmlContent}
            title={title ?? contentItem?.title ?? 'Content'}
            style={{ flex: 1, width: '100%', minHeight: 400, border: 'none' }}
            allow={isVideo ? 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture' : undefined}
            allowFullScreen={isVideo}
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <View style={[styles.publishBar, { backgroundColor: cardBg }]}>
        <ThemedText style={[styles.publishBarLabel, { color: mutedColor }]}>
          {isPublished ? 'Published' : 'Draft'}
        </ThemedText>
        <TouchableOpacity
          style={[styles.publishBarButton, { backgroundColor: isPublished ? mutedColor : successColor }]}
          onPress={handlePublishToggle}
          disabled={publishLoading}
        >
          {publishLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.publishBarButtonText}>
              {isPublished ? 'Unpublish' : 'Publish'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
      <WebViewNative
        source={source}
        style={styles.webview}
        scrollEnabled
        showsVerticalScrollIndicator
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        )}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowFileAccess
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { fontSize: 16, textAlign: 'center' },
  linkPrompt: { fontSize: 16, marginBottom: 12, textAlign: 'center' },
  linkUrl: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
  openLink: { fontSize: 16, fontWeight: '600' },
  publishBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  publishBarLabel: { fontSize: 14 },
  publishBarButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  publishBarButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  webWrap: { flex: 1, minHeight: 400 },
  webview: { flex: 1, backgroundColor: '#ffffff' },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
