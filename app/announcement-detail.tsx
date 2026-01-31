import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { triggerHaptic } from '@/utils/haptics'
import { SPACING, getElevation, MIN_TOUCH_TARGET } from '@/constants/Material'

export default function AnnouncementDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    id: string
    title: string
    description: string
    postedOn: string
    type: string
    contentUrls?: string
    imageUrls?: string
  }>()
  const { width: screenWidth } = useWindowDimensions()
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')
  const successColor = useThemeColor({}, 'success')
  const warningColor = useThemeColor({}, 'warning')
  const errorColor = useThemeColor({}, 'error')
  const borderColor = useThemeColor({}, 'border')

  const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
  const PDF_EXT = '.pdf'
  const getAttachmentType = (url: string): 'image' | 'pdf' | 'document' => {
    const path = (url.split('?')[0] ?? '').toLowerCase()
    if (IMAGE_EXTENSIONS.some(ext => path.endsWith(ext))) return 'image'
    if (path.endsWith(PDF_EXT)) return 'pdf'
    return 'document'
  }

  const contentUrls = useMemo(() => {
    try {
      const raw = params.contentUrls
      if (!raw) return []
      const parsed = JSON.parse(raw as string)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [params.contentUrls])

  const imageUrls = useMemo(() => {
    try {
      const raw = params.imageUrls
      if (!raw) return []
      const parsed = JSON.parse(raw as string)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [params.imageUrls])

  const firstImageUrl = imageUrls[0] ?? contentUrls.find((url) => getAttachmentType(url) === 'image') ?? null

  const typeColor =
    params.type === 'ALERT' ? errorColor : params.type === 'EVENT' ? warningColor : successColor

  const formattedDate = params.postedOn
    ? new Date(params.postedOn).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const getAttachmentLabel = (url: string, index: number): string => {
    const type = getAttachmentType(url)
    const path = (url.split('?')[0] ?? '').split('/').pop() ?? ''
    const name = path && path.length < 40 ? path : ''
    if (type === 'image') return name || `Image ${index + 1}`
    if (type === 'pdf') return name || `Document ${index + 1} (PDF)`
    return name || `Document ${index + 1}`
  }

  const displayTitle = params.title || 'Notice'

  const openLink = (url: string) => {
    if (Platform.OS !== 'web') triggerHaptic('selection')
    const type = getAttachmentType(url)
    if (type === 'image') {
      router.push({
        pathname: '/image-viewer',
        params: { url, title: displayTitle },
      })
    } else {
      router.push({
        pathname: '/in-app-browser',
        params: { url, title: displayTitle },
      })
    }
  }
  const displayDescription = params.description || 'No description.'
  const displayType = params.type || 'NOTICE'

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {firstImageUrl ? (
          <View style={[styles.fullImageWrap, { backgroundColor: cardBackground }]}>
            <Image
              source={{ uri: firstImageUrl }}
              style={[styles.fullImage, { width: screenWidth - SPACING.md * 2 }]}
              resizeMode="cover"
              accessibilityLabel="Announcement image"
            />
          </View>
        ) : null}
        <View style={[styles.card, { backgroundColor: cardBackground }, getElevation(1)]}>
          <View style={styles.metaRow}>
            <View style={[styles.typeChip, { backgroundColor: `${typeColor}20` }]}>
              <ThemedText style={[styles.typeText, { color: typeColor }]}>{displayType}</ThemedText>
            </View>
            {formattedDate ? (
              <View style={styles.dateRow}>
                <IconSymbol name="calendar" size={14} color={mutedColor} />
                <ThemedText style={[styles.dateText, { color: mutedColor }]}>
                  {formattedDate}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <ThemedText style={[styles.title, { color: textColor }]}>{displayTitle}</ThemedText>

          <ThemedText style={[styles.description, { color: textColor }]}>
            {displayDescription}
          </ThemedText>

          {contentUrls.length > 0 ? (
            <View style={styles.attachmentsSection}>
              <ThemedText style={[styles.attachmentsLabel, { color: mutedColor }]}>
                Attachments & links
              </ThemedText>
              <View style={[styles.attachmentsList, { borderColor }]}>
                {contentUrls.map((url, i) => {
                  const type = getAttachmentType(url)
                  const iconName = type === 'image' ? 'photo.fill' : type === 'pdf' ? 'doc.fill' : 'link'
                  return (
                    <Pressable
                      key={i}
                      style={({ pressed }) => [
                        styles.linkTile,
                        { borderColor },
                        i === contentUrls.length - 1 && styles.linkTileLast,
                        pressed && styles.linkTilePressed,
                      ]}
                      onPress={() => openLink(url)}
                      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    >
                      <View style={[styles.linkIconWrap, { backgroundColor: `${primaryColor}15` }]}>
                        <IconSymbol name={iconName} size={20} color={primaryColor} />
                      </View>
                      <ThemedText
                        style={[styles.linkText, { color: primaryColor }]}
                        numberOfLines={1}
                      >
                        {getAttachmentLabel(url, i)}
                      </ThemedText>
                      <IconSymbol name="chevron.right" size={18} color={mutedColor} />
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  fullImageWrap: {
    marginBottom: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  fullImage: {
    height: 240,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  typeChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  dateText: {
    fontSize: 13,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  attachmentsSection: {
    marginTop: SPACING.sm,
  },
  attachmentsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  attachmentsList: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  linkTile: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  linkTilePressed: {
    opacity: 0.9,
  },
  linkTileLast: {
    borderBottomWidth: 0,
  },
  linkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    minWidth: 0,
  },
})
