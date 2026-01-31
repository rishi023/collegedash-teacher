import { ThemedText } from '@/components/ThemedText'
import {
  BOTTOM_SHEET_ELEVATION,
  BOTTOM_SHEET_RADIUS,
  getElevation,
  SPACING,
} from '@/constants/Material'
import { useThemeColor } from '@/hooks/useThemeColor'
import * as Haptics from 'expo-haptics'
import React, { useEffect } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export interface BottomSheetButton {
  text: string
  onPress: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

interface BottomSheetProps {
  visible: boolean
  onDismiss: () => void
  title?: string
  message?: string | React.ReactNode
  buttons?: BottomSheetButton[]
  children?: React.ReactNode
}

export function BottomSheet({
  visible,
  onDismiss,
  title,
  message,
  buttons = [],
  children,
}: BottomSheetProps) {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropAnim = React.useRef(new Animated.Value(0)).current
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')
  const errorColor = useThemeColor({}, 'error')

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, slideAnim, backdropAnim])

  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  })

  const getButtonStyle = (style?: BottomSheetButton['style']) => {
    if (style === 'destructive') return { color: errorColor }
    if (style === 'cancel') return { color: mutedColor }
    return { color: primaryColor, fontWeight: '600' as const }
  }

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              triggerHaptic()
              onDismiss()
            }}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: cardBackground,
              transform: [{ translateY: slideAnim }],
            },
            getElevation(BOTTOM_SHEET_ELEVATION),
          ]}
        >
          <View style={styles.handleBar} />
          {title != null && title !== '' && (
            <ThemedText style={[styles.title, { color: textColor }]}>{title}</ThemedText>
          )}
          {message != null && message !== '' && (
            typeof message === 'string' ? (
              <ThemedText style={[styles.message, { color: mutedColor }]}>{message}</ThemedText>
            ) : (
              <View style={styles.messageWrap}>{message}</View>
            )
          )}
          {children != null ? (
            <View style={styles.childContent}>{children}</View>
          ) : null}
          {buttons.length > 0 && (
            <View style={styles.buttons}>
              {buttons.map((btn, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    triggerHaptic()
                    btn.onPress()
                    onDismiss()
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={btn.text}
                >
                  <ThemedText style={[styles.buttonText, getButtonStyle(btn.style)]}>
                    {btn.text}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: '#000',
  },
  sheet: {
    borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
    borderTopRightRadius: BOTTOM_SHEET_RADIUS,
    paddingBottom: SPACING.xl + 24,
    paddingHorizontal: SPACING.md,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    paddingHorizontal: SPACING.sm,
  },
  messageWrap: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  childContent: {
    marginBottom: SPACING.md,
  },
  buttons: {
    gap: SPACING.sm,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: SPACING.sm,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
  },
})
