import { ThemedText } from '@/components/ThemedText'
import { APP_INFO } from '@/constants'
import { useAuth, StudentUseAppError } from '@/contexts/AuthContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { SafeAreaView } from 'react-native-safe-area-context'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.collegedash.student.app&hl=en_IN'
const APP_STORE_URL = 'https://apps.apple.com/app/collegedash-student/id1667269212'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { showConfirm } = useBottomSheet()
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'inputBorder')
  const inputBg = useThemeColor({}, 'inputBackground')

  const showStudentAppPopup = () => {
    const downloadUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL
    showConfirm({
      title: 'Use the Student App',
      message:
        'Your account is for students. Please download the CollegeDash Student app and sign in there to access your dashboard, attendance, fees, and more.',
      buttons: [
        {
          text: 'Close',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: 'Download App',
          onPress: () => Linking.openURL(downloadUrl),
        },
      ],
    })
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      router.replace('/(tabs)')
    } catch (error: unknown) {
      console.error(error)
      const isStudentUseApp =
        error instanceof StudentUseAppError || (error as any)?.code === 'STUDENT_USE_APP'
      if (isStudentUseApp) {
        showStudentAppPopup()
        return
      }
      const message =
        error instanceof Error ? error.message : 'Invalid credentials. Please try again.'
      const isReachOutToAdmin =
        typeof message === 'string' && message.toLowerCase().includes('reach out to administrator')
      if (isReachOutToAdmin) {
        router.replace('/access-unavailable')
        return
      }
      Alert.alert('Error', message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} />
              <ThemedText style={[styles.title, { color: primaryColor }]}>
                {APP_INFO.NAME}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
                Teacher Portal
              </ThemedText>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>User Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: inputBg, borderColor, color: textColor },
                  ]}
                  placeholder="Enter your user name"
                  placeholderTextColor={mutedColor}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>Password</ThemedText>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      { backgroundColor: inputBg, borderColor, color: textColor },
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={mutedColor}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((p) => !p)}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <IconSymbol
                      name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                      size={22}
                      color={mutedColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: primaryColor },
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  loginButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupText: {
    textAlign: 'center',
    fontSize: 14,
  },
  demoCredentials: {
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    marginBottom: 2,
  },
})
