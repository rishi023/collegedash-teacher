import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { dummyTimetable, TimeSlot } from '@/services/dummyData';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetableScreen() {
  const backgroundColor = useThemeColor({}, 'secondary');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const [selectedDay, setSelectedDay] = useState('Monday');

  // Group timetable by day
  const timetableByDay = dummyTimetable.reduce((acc, slot) => {
    if (!acc[slot.day]) {
      acc[slot.day] = [];
    }
    acc[slot.day].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  // Sort slots by period
  Object.keys(timetableByDay).forEach((day) => {
    timetableByDay[day].sort((a, b) => a.period - b.period);
  });

  const selectedDaySlots = timetableByDay[selectedDay] || [];

  const getSubjectColor = (subject: string) => {
    const colors = {
      Mathematics: '#3b82f6',
      English: '#10b981',
      Science: '#f59e0b',
      'Social Studies': '#8b5cf6',
      Hindi: '#ef4444',
      'Computer Science': '#06b6d4',
      'Physical Education': '#84cc16',
      Art: '#ec4899',
      Music: '#f97316',
      Library: '#6b7280',
      Assembly: '#14b8a6',
    };
    return colors[subject as keyof typeof colors] || '#6b7280';
  };

  return (
    <SafeAreaView edges={{ top: 'off', bottom: 'additive' }} style={[styles.container, { backgroundColor }]}>
      {/* Day Selector */}
      <View style={[styles.daySelector, { backgroundColor: cardBackground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDay === day && { backgroundColor: primaryColor + '20', borderColor: primaryColor },
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <ThemedText style={[styles.dayButtonText, { color: selectedDay === day ? primaryColor : mutedColor }]}>
                {day.substring(0, 3)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Selected Day Title */}
        <View style={styles.selectedDayHeader}>
          <ThemedText style={[styles.selectedDayTitle, { color: textColor }]}>{selectedDay}</ThemedText>
          <ThemedText style={[styles.selectedDaySubtitle, { color: mutedColor }]}>
            {selectedDaySlots.length} periods
          </ThemedText>
        </View>

        {/* Time Slots */}
        <View style={styles.slotsContainer}>
          {selectedDaySlots.map((slot, index) => (
            <View key={slot.id} style={[styles.slotCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={[styles.periodIndicator, { backgroundColor: getSubjectColor(slot.subject) }]}>
                <ThemedText style={styles.periodText}>{slot.period}</ThemedText>
              </View>

              <View style={styles.slotContent}>
                <View style={styles.slotHeader}>
                  <ThemedText style={[styles.subjectText, { color: textColor }]}>{slot.subject}</ThemedText>
                  <ThemedText style={[styles.timeText, { color: mutedColor }]}>
                    {slot.startTime} - {slot.endTime}
                  </ThemedText>
                </View>

                <View style={styles.slotDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="person" size={14} color={mutedColor} />
                    <ThemedText style={[styles.detailText, { color: mutedColor }]}>{slot.teacher}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <IconSymbol name="location" size={14} color={mutedColor} />
                    <ThemedText style={[styles.detailText, { color: mutedColor }]}>{slot.room}</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {selectedDaySlots.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="calendar" size={48} color={mutedColor} />
              <ThemedText style={[styles.emptyStateText, { color: mutedColor }]}>No classes scheduled</ThemedText>
              <ThemedText style={[styles.emptyStateSubtext, { color: mutedColor }]}>
                No classes are scheduled for {selectedDay}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
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
  scrollContainer: {
    flex: 1,
  },
  daySelector: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDayHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  selectedDayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedDaySubtitle: {
    fontSize: 14,
  },
  slotsContainer: {
    paddingHorizontal: 20,
  },
  slotCard: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodIndicator: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  slotContent: {
    flex: 1,
    padding: 16,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  slotDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
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
