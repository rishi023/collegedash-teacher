import { ThemedText } from '@/components/ThemedText'
import { APP_BAR_HEIGHT, APP_BAR_ELEVATION, SPACING, getElevation } from '@/constants/Material'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useRouter, useNavigation } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconSymbol } from './ui/IconSymbol'

/** Contrasting text/icon color on primary header (white or near-white) */
const HEADER_FOREGROUND = '#ffffff'

interface AppHeaderProps {
  title: string
  showBack?: boolean
  rightAction?: React.ReactNode
}

export function AppHeader({
  title,
  showBack = false,
  rightAction,
}: AppHeaderProps) {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const primaryColor = useThemeColor({}, 'primary')

  const paddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 8 : 12)

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)')
    }
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: primaryColor, paddingTop }, getElevation(APP_BAR_ELEVATION)]}>
      <View style={[styles.bar, { height: APP_BAR_HEIGHT }]}>
        <View style={styles.left}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              hitSlop={8}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <IconSymbol name="chevron.left" size={24} color={HEADER_FOREGROUND} />
            </Pressable>
          ) : null}
          <ThemedText style={[styles.title, { color: HEADER_FOREGROUND }]} numberOfLines={1}>
            {title}
          </ThemedText>
        </View>
        <View style={styles.right}>{rightAction ?? null}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
    minWidth: 0,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'left',
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
})
