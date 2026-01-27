import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getExamMarks, getTerms, Term } from '@/services/account'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function GradesScreen() {
  const { user } = useAuth()
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [examMarksData, setExamMarksData] = useState<any>(null)
  const [isLoadingTerms, setIsLoadingTerms] = useState(true)
  const [isLoadingMarks, setIsLoadingMarks] = useState(false)

  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const institutionId = user?.studentDetails?.institutionId
        if (institutionId) {
          setIsLoadingTerms(true)
          const response = await getTerms(institutionId)
          if (response?.responseObject) {
            setTerms(response.responseObject)
            // Auto-select the first term
            if (response.responseObject.length > 0) {
              setSelectedTerm(response.responseObject[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error)
      } finally {
        setIsLoadingTerms(false)
      }
    }

    fetchTerms()
  }, [user?.studentDetails?.institutionId])

  useEffect(() => {
    const fetchExamMarks = async () => {
      try {
        const studentId = user?.studentDetails?.studentId
        const classId = user?.studentDetails?.classId

        if (studentId && classId && selectedTerm) {
          setIsLoadingMarks(true)
          const response = await getExamMarks(studentId, selectedTerm, classId)
          if (response?.responseObject) {
            setExamMarksData(response.responseObject)
          }
        }
      } catch (error) {
        console.error('Error fetching exam marks:', error)
      } finally {
        setIsLoadingMarks(false)
      }
    }

    if (selectedTerm) {
      fetchExamMarks()
    }
  }, [selectedTerm, user?.studentDetails?.studentId, user?.studentDetails?.classId])

  const calculateOverallAverage = () => {
    if (!examMarksData?.studentExamMarksList) return 0

    let totalMarks = 0
    let count = 0

    examMarksData.studentExamMarksList.forEach((exam: any) => {
      exam.studentSubjectMarks.forEach((subject: any) => {
        totalMarks += subject.marksObtained
        count++
      })
    })

    return count > 0 ? Math.round(totalMarks / count) : 0
  }

  const getTotalExams = () => {
    return examMarksData?.studentExamMarksList?.length || 0
  }

  const getMarkColor = (marks: number) => {
    if (marks >= 90) return '#10b981'
    if (marks >= 75) return '#059669'
    if (marks >= 60) return '#f59e0b'
    if (marks >= 50) return '#d97706'
    if (marks >= 35) return '#ef4444'
    return '#dc2626'
  }

  return (
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      <View style={[styles.summaryCard, { backgroundColor: cardBackground }]}>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryValue, { color: textColor }]}>
            {calculateOverallAverage()}
          </ThemedText>
          <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>
            Overall Average
          </ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryValue, { color: textColor }]}>
            {getTotalExams()}
          </ThemedText>
          <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>Total Exams</ThemedText>
        </View>
      </View>

      <View style={styles.filterScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {isLoadingTerms ? (
            <View style={styles.filterLoadingContainer}>
              <ActivityIndicator size="small" color={primaryColor} />
            </View>
          ) : (
            terms.map(term => (
              <TouchableOpacity
                key={term.id}
                style={[
                  styles.filterButton,
                  { backgroundColor: borderColor },
                  selectedTerm === term.id && { backgroundColor: primaryColor },
                ]}
                onPress={() => setSelectedTerm(term.id)}
              >
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    { color: mutedColor },
                    selectedTerm === term.id && { color: '#ffffff' },
                  ]}
                >
                  {term.name}
                </ThemedText>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <ScrollView style={styles.gradesContainer} showsVerticalScrollIndicator={false}>
        {isLoadingMarks ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
              Loading exam marks...
            </ThemedText>
          </View>
        ) : examMarksData?.studentExamMarksList && examMarksData.studentExamMarksList.length > 0 ? (
          examMarksData.studentExamMarksList.map((exam: any, examIndex: number) => (
            <View key={examIndex} style={[styles.examSection, { backgroundColor: cardBackground }]}>
              <View style={styles.examHeader}>
                <View>
                  <ThemedText style={[styles.examName, { color: textColor }]}>
                    {exam.examName}
                  </ThemedText>
                  {exam.examActivityName && (
                    <ThemedText style={[styles.examActivity, { color: mutedColor }]}>
                      {exam.examActivityName}
                    </ThemedText>
                  )}
                </View>
              </View>

              <View style={styles.subjectsContainer}>
                {exam.studentSubjectMarks.map((subject: any, subjectIndex: number) => (
                  <View
                    key={subject.id}
                    style={[
                      styles.subjectRow,
                      { borderBottomColor: borderColor },
                      subjectIndex === exam.studentSubjectMarks.length - 1 && styles.lastSubjectRow,
                    ]}
                  >
                    <View style={styles.subjectInfo}>
                      <IconSymbol name="book.fill" size={16} color={mutedColor} />
                      <ThemedText style={[styles.subjectName, { color: textColor }]}>
                        {subject.subjectName}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.marksBadge,
                        { backgroundColor: `${getMarkColor(subject.marksObtained)}20` },
                      ]}
                    >
                      <ThemedText
                        style={[styles.marksText, { color: getMarkColor(subject.marksObtained) }]}
                      >
                        {subject.marksObtained}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="chart.bar.fill" size={48} color={mutedColor} />
            <ThemedText style={[styles.emptyStateText, { color: textColor }]}>
              No Exam Marks Found
            </ThemedText>
            <ThemedText style={[styles.emptyStateSubtext, { color: mutedColor }]}>
              {selectedTerm
                ? 'No exam marks available for the selected term.'
                : 'Please select a term to view marks.'}
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
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  filterScrollContainer: {
    flexGrow: 0,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterLoadingContainer: {
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gradesContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
  examSection: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  examHeader: {
    marginBottom: 12,
  },
  examName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  examActivity: {
    fontSize: 14,
  },
  subjectsContainer: {
    gap: 0,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastSubjectRow: {
    borderBottomWidth: 0,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
  },
  marksBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  marksText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
})
