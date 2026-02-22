import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { router } from 'expo-router'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AccessUnavailableScreen() {
  const primaryColor = useThemeColor({}, 'primary')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: useThemeColor({}, 'secondary') }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: `${primaryColor}20` }]}>
          <ThemedText style={[styles.iconText, { color: primaryColor }]}>!</ThemedText>
        </View>
        <ThemedText style={[styles.title, { color: textColor }]}>Access Unavailable</ThemedText>
        <ThemedText style={[styles.message, { color: mutedColor }]}>
          Please reach out to administrator.
        </ThemedText>
        <ThemedText style={[styles.subtext, { color: mutedColor }]}>
          This institution's access is currently disabled. For assistance, contact your institution administrator.
        </ThemedText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 17,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
