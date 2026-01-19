import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Assignment, dummyAssignments } from '@/services/dummyData';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AssignmentsScreen() {
  const backgroundColor = useThemeColor({}, 'secondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const filters = ['All', 'Pending', 'Submitted', 'Overdue'];

  const filteredAssignments =
    selectedFilter === 'All'
      ? dummyAssignments
      : dummyAssignments.filter((assignment) => assignment.status === selectedFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return '#10b981';
      case 'Pending':
        return '#f59e0b';
      case 'Overdue':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'checkmark.circle.fill';
      case 'Pending':
        return 'clock.fill';
      case 'Overdue':
        return 'exclamationmark.triangle.fill';
      default:
        return 'questionmark.circle.fill';
    }
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleAssignmentPress = (assignment: Assignment) => {
    const daysUntil = getDaysUntilDue(assignment.dueDate);
    const dueDateText =
      daysUntil > 0
        ? `Due in ${daysUntil} days`
        : daysUntil === 0
        ? 'Due today'
        : `Overdue by ${Math.abs(daysUntil)} days`;

    Alert.alert(
      assignment.title,
      `Subject: ${assignment.subject}\n\nDescription: ${assignment.description}\n\n${dueDateText}\n\nTotal Marks: ${
        assignment.totalMarks
      }${assignment.marks ? `\nMarks Obtained: ${assignment.marks}` : ''}`,
      [
        { text: 'Close', style: 'cancel' },
        ...(assignment.status === 'Pending'
          ? [
              {
                text: 'Mark as Submitted',
                onPress: () => Alert.alert('Success', 'Assignment marked as submitted!'),
              },
            ]
          : []),
      ]
    );
  };

  const getAssignmentStats = () => {
    const total = dummyAssignments.length;
    const submitted = dummyAssignments.filter((a) => a.status === 'Submitted').length;
    const pending = dummyAssignments.filter((a) => a.status === 'Pending').length;
    const overdue = dummyAssignments.filter((a) => a.status === 'Overdue').length;

    return { total, submitted, pending, overdue };
  };

  const stats = getAssignmentStats();

  return (
    <SafeAreaView edges={{ top: 'off', bottom: 'additive' }} style={[styles.container, { backgroundColor }]}>
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: cardBackground, borderLeftColor: '#10b981' }]}>
            <ThemedText style={[styles.statNumber, { color: '#10b981' }]}>{stats.submitted}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Submitted</ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBackground, borderLeftColor: '#f59e0b' }]}>
            <ThemedText style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.pending}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Pending</ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBackground, borderLeftColor: '#ef4444' }]}>
            <ThemedText style={[styles.statNumber, { color: '#ef4444' }]}>{stats.overdue}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Overdue</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.filterScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              { backgroundColor: borderColor },
              selectedFilter === filter && { backgroundColor: primaryColor },
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                { color: mutedColor },
                selectedFilter === filter && { color: '#ffffff' },
              ]}
            >
              {filter}
            </ThemedText>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.assignmentsContainer} showsVerticalScrollIndicator={false}>
        {filteredAssignments.map((assignment) => {
          const daysUntil = getDaysUntilDue(assignment.dueDate);
          const isUrgent = daysUntil <= 1 && assignment.status === 'Pending';

          return (
            <TouchableOpacity
              key={assignment.id}
              style={[styles.assignmentCard, { backgroundColor: cardBackground }, isUrgent && styles.urgentCard]}
              onPress={() => handleAssignmentPress(assignment)}
            >
              <View style={styles.assignmentHeader}>
                <View style={styles.assignmentInfo}>
                  <ThemedText style={[styles.assignmentTitle, { color: textColor }]}>{assignment.title}</ThemedText>
                  <ThemedText style={[styles.subjectName, { color: mutedColor }]}>{assignment.subject}</ThemedText>
                </View>
                <View style={styles.statusContainer}>
                  <IconSymbol
                    name={getStatusIcon(assignment.status)}
                    size={20}
                    color={getStatusColor(assignment.status)}
                  />
                </View>
              </View>

              <ThemedText style={[styles.assignmentDescription, { color: mutedColor }]} numberOfLines={2}>
                {assignment.description}
              </ThemedText>

              <View style={styles.assignmentFooter}>
                <View style={styles.dateContainer}>
                  <IconSymbol name="calendar" size={14} color={mutedColor} />
                  <ThemedText style={[styles.dueDateText, { color: isUrgent ? '#ef4444' : '#6b7280' }]}>
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </ThemedText>
                </View>

                <View style={styles.marksContainer}>
                  <IconSymbol name="star.fill" size={14} color={mutedColor} />
                  <ThemedText style={[styles.marksText, { color: mutedColor }]}>
                    {assignment.marks ? `${assignment.marks}/` : ''}
                    {assignment.totalMarks} marks
                  </ThemedText>
                </View>
              </View>

              {assignment.status === 'Submitted' && assignment.submissionDate && (
                <View style={[styles.submissionInfo, { borderTopColor: borderColor }]}>
                  <IconSymbol name="checkmark.circle" size={14} color="#10b981" />
                  <ThemedText style={[styles.submissionText, { color: useThemeColor({}, 'success') }]}>
                    Submitted on {new Date(assignment.submissionDate).toLocaleDateString()}
                  </ThemedText>
                </View>
              )}

              {isUrgent && (
                <View style={styles.urgentBadge}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={12} color="#ffffff" />
                  <ThemedText style={styles.urgentText}>URGENT</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filteredAssignments.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text" size={48} color={mutedColor} />
            <ThemedText style={[styles.emptyStateText, { color: mutedColor }]}>No assignments found</ThemedText>
            <ThemedText style={[styles.emptyStateSubtext, { color: mutedColor }]}>
              {selectedFilter === 'All'
                ? 'No assignments have been assigned yet'
                : `No ${selectedFilter.toLowerCase()} assignments`}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  filterScrollContainer: {
    flexGrow: 0,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  assignmentsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  assignmentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
  },
  assignmentDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
  },
  marksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  marksText: {
    fontSize: 12,
  },
  submissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  submissionText: {
    fontSize: 12,
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
