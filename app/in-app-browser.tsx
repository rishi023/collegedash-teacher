import { useThemeColor } from '@/hooks/useThemeColor'
import { useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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

  const primaryColor = useThemeColor({}, 'primary')
  const backgroundColor = useThemeColor({}, 'secondary')

  const viewerUrl = useMemo(() => {
    if (!url) return ''
    if (isPdfUrl(url)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    }
    return url
  }, [url])

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

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <WebViewNative
        source={{ uri: viewerUrl }}
        style={styles.webview}
        scrollEnabled
        showsVerticalScrollIndicator
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        )}
        originWhitelist={['*']}
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
