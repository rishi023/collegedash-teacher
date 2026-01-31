import { useThemeColor } from '@/hooks/useThemeColor'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ImageViewerScreen() {
  const params = useLocalSearchParams<{ url: string; title?: string }>()
  const url = (params.url ?? '').trim()

  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

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
        <View style={styles.imageWrap}>
          <img
            src={url}
            alt="Attachment"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onLoad={() => setLoading(false)}
            onError={() => setError(true)}
          />
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        )}
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: url }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setError(true)}
        />
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      )}
      {error && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 200,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
