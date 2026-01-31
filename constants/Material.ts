/**
 * Material Design 3–style constants for mobile.
 * Same as student app for consistent header/shell.
 */

import { Platform } from 'react-native'

// Spacing (4dp grid)
export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

// App bar (top header)
export const APP_BAR_HEIGHT = 56
export const APP_BAR_ELEVATION = 4

// Bottom navigation
export const BOTTOM_NAV_HEIGHT = 64
export const BOTTOM_NAV_ELEVATION = 8
export const BOTTOM_NAV_ICON_SIZE = 24
export const BOTTOM_NAV_LABEL_SIZE = 12

// Bottom sheet
export const BOTTOM_SHEET_RADIUS = 16
export const BOTTOM_SHEET_ELEVATION = 16

// Touch target minimum (Material: 48dp)
export const MIN_TOUCH_TARGET = 48

// Elevation shadows (approximate for iOS/Android; web uses boxShadow to avoid deprecation)
export const getElevation = (elevation: number) =>
  Platform.select({
    android: { elevation },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.2,
      shadowRadius: elevation,
    },
    web: {
      boxShadow: `0px ${elevation / 2}px ${elevation}px 0px rgba(0,0,0,0.2)`,
    },
    default: {},
  })

/** Card-style shadow: use on web to avoid deprecated shadow* props */
export const getCardShadow = () =>
  Platform.select({
    web: { boxShadow: '0px 2px 4px 0px rgba(0,0,0,0.1)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  })
