import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getSubjects, Subject } from '@/services/account'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SubjectsScreen() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const primaryColor = useThemeColor({}, 'primary')

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const batchId = user?.studentDetails?.batchId
        const classId = user?.studentDetails?.classId
        const section = user?.studentDetails?.section

        if (batchId && classId && section) {
          setIsLoading(true)
          const response = await getSubjects(batchId, classId, section)
          if (response?.responseObject) {
            setSubjects(response.responseObject)
          }
        }
      } catch (error) {
        console.error('Error fetching subjects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubjects()
  }, [user?.studentDetails?.batchId, user?.studentDetails?.classId, user?.studentDetails?.section])

  return (
    <SafeAreaView
      edges={{ top: 'additive', bottom: 'off' }}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
              Loading subjects...
            </ThemedText>
          </View>
        ) : subjects.length > 0 ? (
          <View style={styles.subjectsContainer}>
            {subjects.map((subject, index) => (
              <View
                key={index}
                style={[styles.subjectCard, { backgroundColor: cardBackground, borderColor }]}
              >
                <View style={styles.subjectHeader}>
                  <View style={[styles.subjectIcon, { backgroundColor: `${primaryColor}20` }]}>
                    <IconSymbol name="book.fill" size={24} color={primaryColor} />
                  </View>
                  <View style={styles.subjectInfo}>
                    <ThemedText style={[styles.subjectName, { color: textColor }]}>
                      {subject.subjectName}
                    </ThemedText>
                    <View style={styles.teacherRow}>
                      <IconSymbol name="person.fill" size={14} color={mutedColor} />
                      <ThemedText style={[styles.teacherText, { color: mutedColor }]}>
                        {subject.teacherName}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="book.fill" size={48} color={mutedColor} />
            <ThemedText style={[styles.emptyStateTitle, { color: textColor }]}>
              No Subjects Found
            </ThemedText>
            <ThemedText style={[styles.emptyStateDescription, { color: mutedColor }]}>
              No subjects are available for your class at the moment.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  subjectsContainer: {
    padding: 20,
    gap: 16,
  },
  subjectCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
    gap: 4,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teacherText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
})
