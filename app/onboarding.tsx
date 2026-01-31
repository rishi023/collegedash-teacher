import { ThemedText } from '@/components/ThemedText'
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol'
import { APP_INFO } from '@/constants'
import { useThemeColor } from '@/hooks/useThemeColor'
import { storage } from '@/services/storage'
import { useRouter } from 'expo-router'
import React, { useCallback, useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  Keyboard,
  ListRenderItem,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface Slide {
  id: string
  icon: IconSymbolName
  title: string
  subtitle: string
  accentColor: string
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'checkmark.circle.fill',
    title: 'Mark Attendance',
    subtitle: 'Mark your attendance with geolocation when you are at the institution.',
    accentColor: '#2563eb',
  },
  {
    id: '2',
    icon: 'bell.fill',
    title: 'News & Announcements',
    subtitle: 'Stay updated with notices, news, and announcements in one place.',
    accentColor: '#7c3aed',
  },
  {
    id: '3',
    icon: 'doc.text.fill',
    title: 'Attendance & Payslips',
    subtitle: 'View your attendance report and download payslips anytime.',
    accentColor: '#059669',
  },
  {
    id: '4',
    icon: 'person.text.rectangle.fill',
    title: 'Teaching & More',
    subtitle: 'Teachers can give assignments, mark student attendance, and create e-content.',
    accentColor: '#dc2626',
  },
]

export default function OnboardingScreen() {
  const primaryColor = useThemeColor({}, 'primary')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index)
      }
    }
  ).current
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  const handleGetStarted = useCallback(async () => {
    if (isNavigating) return
    setIsNavigating(true)
    if (Platform.OS !== 'web') Keyboard.dismiss()
    try {
      await storage.setOnboardingSeen(true)
      router.replace('/login')
    } catch (e) {
      console.error(e)
      router.replace('/login')
    } finally {
      setIsNavigating(false)
    }
  }, [router, isNavigating])

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: `${item.accentColor}12`,
            borderColor: `${item.accentColor}28`,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: `${item.accentColor}22`,
              borderColor: `${item.accentColor}44`,
            },
          ]}
        >
          <IconSymbol name={item.icon} size={64} color={item.accentColor} />
        </View>
        <ThemedText style={[styles.slideTitle, { color: textColor }]}>
          {item.title}
        </ThemedText>
        <ThemedText style={[styles.slideSubtitle, { color: mutedColor }]}>
          {item.subtitle}
        </ThemedText>
      </View>
    </View>
  )

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.logoRow}>
        <ThemedText style={[styles.institutionName, { color: textColor }]}>
          {APP_INFO.NAME}
        </ThemedText>
        <ThemedText style={[styles.appLabel, { color: mutedColor }]}>
          Staff App
        </ThemedText>
      </View>

      <View style={styles.carouselWrap}>
        <FlatList
          data={SLIDES}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="start"
          contentContainerStyle={styles.flatListContent}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? primaryColor : mutedColor,
                  opacity: i === currentIndex ? 1 : 0.35,
                  transform: [{ scale: i === currentIndex ? 1.2 : 1 }],
                },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={handleGetStarted}
          activeOpacity={0.85}
          disabled={isNavigating}
        >
          <ThemedText style={styles.buttonText}>
            {isNavigating ? 'Opening...' : 'Get started'}
          </ThemedText>
          <IconSymbol name="chevron.right" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  logoRow: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  institutionName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appLabel: {
    marginTop: 8,
    fontSize: 16,
  },
  carouselWrap: {
    flex: 1,
    minHeight: 280,
  },
  flatListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 28,
    borderRadius: 24,
    borderWidth: 1,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 2,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  slideSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: '#f8fafc',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
})
