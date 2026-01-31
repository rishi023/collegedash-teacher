import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'

interface SectionHeaderProps {
  title: string
  right?: React.ReactNode
  style?: ViewStyle
  accentColor?: string
  titleColor?: string
}

export function SectionHeader({
  title,
  right,
  style,
  accentColor: accentColorProp,
  titleColor: titleColorProp,
}: SectionHeaderProps) {
  const primaryColor = useThemeColor({}, 'primary')
  const textColor = useThemeColor({}, 'text')
  const accentColor = accentColorProp ?? primaryColor
  const titleColor = titleColorProp ?? textColor

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          <ThemedText
            style={[styles.title, { color: titleColor }]}
            numberOfLines={1}
          >
            {title}
          </ThemedText>
        </View>
        {right != null ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  accent: {
    width: 4,
    borderRadius: 2,
    marginRight: 10,
    minHeight: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
    flex: 1,
  },
  right: {
    marginLeft: 8,
  },
})
