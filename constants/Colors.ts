/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Additional colors for the student app
    primary: '#2563eb',
    secondary: '#f8fafc',
    card: '#ffffff',
    border: '#e5e7eb',
    inputBackground: '#ffffff',
    inputBorder: '#d1d5db',
    muted: '#6b7280',
    mutedForeground: '#9ca3af',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Additional colors for the student app
    primary: '#3b82f6',
    secondary: '#1f2937',
    card: '#374151',
    border: '#4b5563',
    inputBackground: '#374151',
    inputBorder: '#6b7280',
    muted: '#9ca3af',
    mutedForeground: '#6b7280',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
  },
};
