import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection'

/**
 * Trigger haptic feedback for a native app feel.
 * Use for button presses, tab changes, list selection, success/error.
 * No-op on web.
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  if (Platform.OS === 'web') return
  try {
    switch (type) {
      case 'light':
      case 'medium':
      case 'heavy':
        Haptics.impactAsync(
          type === 'light'
            ? Haptics.ImpactFeedbackStyle.Light
            : type === 'medium'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Heavy
        )
        break
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        break
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        break
      case 'selection':
        Haptics.selectionAsync()
        break
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  } catch {
    // Haptics may be unavailable on some devices/simulators
  }
}
