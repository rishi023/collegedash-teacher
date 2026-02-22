import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getViewableUrl } from '@/services/fileCache'
import { getDownloadPath } from '@/services/downloadStorage'
import { downloadPdf } from '@/services/downloadPdf'
import { getAuthToken } from '@/services/axios'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { triggerHaptic } from '@/utils/haptics'

const WebViewNative =
  Platform.OS !== 'web'
    ? require('react-native-webview').WebView
    : null

const PDF_EXT = '.pdf'

function isPdfUrl(url: string): boolean {
  const lower = (url.split('?')[0] ?? '').toLowerCase()
  return lower.endsWith(PDF_EXT)
}

export default function InAppBrowserScreen() {
  const params = useLocalSearchParams<{ url: string; title?: string }>()
  const url = (params.url ?? '').trim()
  const title = params.title ?? 'Link'
  const [displayUrl, setDisplayUrl] = useState(url)
  const [localPath, setLocalPath] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const { showAlert } = useBottomSheet()

  const primaryColor = useThemeColor({}, 'primary')
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBg = useThemeColor({}, 'card')

  useEffect(() => {
    if (!url) return
    getViewableUrl(url, { getAuthToken }).then(setDisplayUrl)
  }, [url])

  useEffect(() => {
    if (Platform.OS === 'web' || !url) return
    getDownloadPath(url).then(setLocalPath)
  }, [url])

  const handleDownload = useCallback(async () => {
    if (Platform.OS === 'web' || !url || !isPdfUrl(url) || downloading) return
    triggerHaptic('light')
    setDownloading(true)
    try {
      const localUri = await downloadPdf(url, title, getAuthToken)
      if (localUri) {
        setLocalPath(localUri)
        showAlert('Downloaded', 'PDF saved. You can open it from this screen anytime.')
      } else {
        showAlert('Error', 'Could not download PDF. Please try again.')
      }
    } finally {
      setDownloading(false)
    }
  }, [url, title, downloading, showAlert])

  const viewerUrl = useMemo(() => {
    if (!displayUrl) return ''
    if (displayUrl.startsWith('blob:')) {
      return displayUrl
    }
    if (isPdfUrl(url)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(displayUrl)}&embedded=true`
    }
    return displayUrl
  }, [displayUrl, url])

  const nativeSourceUri = Platform.OS === 'web' ? viewerUrl : (localPath || viewerUrl)

  if (!url) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </SafeAreaView>
    )
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <iframe
          src={viewerUrl}
          title={title}
          style={styles.webview}
        />
      </SafeAreaView>
    )
  }

  const showDownloadButton = isPdfUrl(url)

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      {showDownloadButton && (
        <View style={[styles.toolbar, { backgroundColor: cardBg }]}>
          <TouchableOpacity
            style={[styles.toolbarButton, { backgroundColor: primaryColor }]}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol name="arrow.down.doc.fill" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}
      <WebViewNative
        source={{ uri: nativeSourceUri }}
        style={styles.webview}
        scrollEnabled
        showsVerticalScrollIndicator
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        )}
        originWhitelist={['*', 'file://']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowFileAccess
        onShouldStartLoadWithRequest={() => true}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  toolbarButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  webview: {
    flex: 1,
    minHeight: 200,
    backgroundColor: '#ffffff',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
