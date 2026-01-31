import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getHomeworkByDayByCourse, getMySubjects } from '@/services/account'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface SubjectHomework {
  subjectName: string
  homework: string
  attachmentUrls?: string[]
}

export default function HomeworkScreen() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const { user } = useAuth()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [homework, setHomework] = useState<SubjectHomework[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchHomework = useCallback(async () => {
    if (!user?.staffDetails?.institutionId) {
      setHomework([])
      return
    }
    const subjects = await getMySubjects()
    const first = subjects?.find(s => s.courseId && s.year)
    if (!first?.courseId || !first?.year) {
      setHomework([])
      return
    }

    setIsLoading(true)
    try {
      const dateString = formatDateForAPI(selectedDate)
      const data = await getHomeworkByDayByCourse(
        first.courseId,
        first.year,
        first.section,
        dateString,
      )
      setHomework(data?.subjectHomeworkList ?? [])
    } catch (error) {
      console.error('Error fetching homework:', error)
      Alert.alert('Error', 'Failed to fetch homework. Please try again.')
      setHomework([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, user?.staffDetails?.institutionId])

  useEffect(() => {
    fetchHomework()
  }, [fetchHomework])

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateDisplay = (date: Date): string => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (isSameDay(date, today)) return 'Today'
    if (isSameDay(date, tomorrow)) return 'Tomorrow'
    if (isSameDay(date, yesterday)) return 'Yesterday'

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const renderHomeworkCard = (item: SubjectHomework, index: number) => (
    <View
      key={index}
      style={[styles.homeworkCard, { backgroundColor: cardBackground, borderColor }]}
    >
      <View style={styles.homeworkHeader}>
        <View style={styles.subjectIconContainer}>
          <IconSymbol name="book.fill" size={20} color={primaryColor} />
        </View>
        <View style={styles.homeworkInfo}>
          <ThemedText style={[styles.homeworkSubject, { color: primaryColor }]}>
            {item.subjectName}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.homeworkDescription, { color: textColor }]}>
        {item.homework}
      </ThemedText>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="doc.text" size={48} color={mutedColor} />
      <ThemedText style={[styles.emptyStateTitle, { color: textColor }]}>
        No Homework Found
      </ThemedText>
      <ThemedText style={[styles.emptyStateDescription, { color: mutedColor }]}>
        There are no homework assignments for the selected date.
      </ThemedText>
    </View>
  )

  return (
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      {/* Date Picker Header */}
      <View
        style={[
          styles.datePickerContainer,
          { backgroundColor: cardBackground, borderBottomColor: borderColor },
        ]}
      >
        <TouchableOpacity
          style={[styles.dateNavButton, { backgroundColor: primaryColor }]}
          onPress={() => navigateDate('prev')}
        >
          <IconSymbol name="chevron.left" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.dateDisplayContainer}>
          <IconSymbol name="calendar" size={20} color={primaryColor} />
          <ThemedText style={[styles.dateDisplayText, { color: textColor }]}>
            {formatDateDisplay(selectedDate)}
          </ThemedText>
          <ThemedText style={[styles.dateDisplaySubtext, { color: mutedColor }]}>
            {selectedDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.dateNavButton, { backgroundColor: primaryColor }]}
          onPress={() => navigateDate('next')}
        >
          <IconSymbol name="chevron.right" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Homework Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
              Loading homework...
            </ThemedText>
          </View>
        ) : homework.length > 0 ? (
          <View style={styles.homeworkList}>{homework.map(renderHomeworkCard)}</View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDisplayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  dateDisplayText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  dateDisplaySubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  homeworkList: {
    gap: 12,
    paddingVertical: 20,
  },
  homeworkCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  homeworkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  homeworkInfo: {
    flex: 1,
  },
  homeworkSubject: {
    fontSize: 16,
    fontWeight: '600',
  },
  homeworkDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
})
