import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const WebViewNative =
  Platform.OS !== 'web'
    ? require('react-native-webview').WebView
    : null

function wrapHtmlBody(content: string, isDark: boolean): string {
  const bodyStyle = isDark
    ? `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #e5e5e5; padding: 16px; margin: 0; background: transparent; }
       img { max-width: 100%; height: auto; display: block; }
       a { color: #38bdf8; }
       pre, code { background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; overflow-x: auto; }
       * { max-width: 100%; box-sizing: border-box; }`
    : `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a; padding: 16px; margin: 0; background: transparent; }
       img { max-width: 100%; height: auto; display: block; }
       a { color: #0ea5e9; }
       pre, code { background: #f1f5f9; padding: 8px; border-radius: 6px; overflow-x: auto; }
       * { max-width: 100%; box-sizing: border-box; }`
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob: https: http:;" />
  <style>${bodyStyle}</style>
</head>
<body><div class="news-body">${content || '<p>No content.</p>'}</div></body>
</html>`
}

function formatDate(postedOn: string): string {
  if (!postedOn) return ''
  try {
    return new Date(postedOn).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return postedOn
  }
}

export default function NewsDetailScreen() {
  const params = useLocalSearchParams<{
    id: string
    title: string
    content: string
    postedOn: string
    author: string
    imageUrl: string
  }>()
  const title = params.title ?? ''
  const content = params.content ?? ''
  const postedOn = params.postedOn ?? ''
  const author = params.author ?? ''
  const imageUrl = (params.imageUrl ?? '').trim()

  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')
  const isDark = useThemeColor({}, 'text') === '#e5e5e5' || useThemeColor({}, 'text') === '#e5e7eb'

  const wrappedHtml = useMemo(
    () => wrapHtmlBody(content, isDark),
    [content, isDark]
  )

  const webViewMinHeight = 400

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.header, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.title, { color: textColor }]}>{title}</ThemedText>
          <View style={styles.metaRow}>
            {author ? (
              <ThemedText style={[styles.meta, { color: mutedColor }]}>{author}</ThemedText>
            ) : null}
            <ThemedText style={[styles.date, { color: mutedColor }]}>
              {formatDate(postedOn)}
            </ThemedText>
          </View>
        </View>

        {imageUrl ? (
          <View style={[styles.imageWrap, { backgroundColor: cardBackground }]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
        ) : null}

        <View style={[styles.contentWrap, { backgroundColor: cardBackground }]}>
          {Platform.OS !== 'web' && WebViewNative ? (
            <WebViewNative
              source={{ html: wrappedHtml }}
              style={[styles.webview, { minHeight: webViewMinHeight }]}
              scrollEnabled={false}
              originWhitelist={['*']}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <iframe
              srcDoc={wrappedHtml}
              title={title}
              style={{
                width: '100%',
                minHeight: webViewMinHeight,
                border: 0,
                borderRadius: 12,
              }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meta: { fontSize: 14 },
  date: { fontSize: 14 },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#eee',
  },
  contentWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 200,
    paddingHorizontal: 4,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  webview: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
})
