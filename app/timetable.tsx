import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getMyTimetable, type TimetableSlotItem } from '@/services/account';
import { storage } from '@/services/storage';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
};

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function TimetableScreen() {
  const { user } = useAuth();
  const backgroundColor = useThemeColor({}, 'secondary');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const [slots, setSlots] = useState<TimetableSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');

  const batchId = user?.runningBatchId ?? '';

  const fetchTimetable = useCallback(async () => {
    if (!batchId) {
      const userData = await storage.getUserData();
      const bid = userData?.runningBatchId;
      if (!bid) {
        setSlots([]);
        setLoading(false);
        return;
      }
      const list = await getMyTimetable(bid);
      setSlots(list ?? []);
    } else {
      const list = await getMyTimetable(batchId);
      setSlots(list ?? []);
    }
  }, [batchId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchTimetable();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchTimetable]);

  const onRefresh = async () => {
    setRefreshing(true);
    const userData = await storage.getUserData();
    const bid = userData?.runningBatchId ?? batchId;
    if (bid) {
      const list = await getMyTimetable(bid);
      setSlots(list ?? []);
    }
    setRefreshing(false);
  };

  // Group timetable by day (display label)
  const timetableByDay = React.useMemo(() => {
    const acc: Record<string, TimetableSlotItem[]> = {};
    for (const day of DAY_ORDER) {
      acc[DAY_LABELS[day] ?? day] = [];
    }
    for (const slot of slots) {
      const dayLabel = DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek;
      if (!acc[dayLabel]) acc[dayLabel] = [];
      acc[dayLabel].push(slot);
    }
    for (const day of Object.keys(acc)) {
      acc[day].sort((a, b) => a.period - b.period);
    }
    return acc;
  }, [slots]);

  const daysWithSlots = DAY_ORDER.map(d => DAY_LABELS[d]).filter(d => (timetableByDay[d]?.length ?? 0) > 0);
  const displayDays = daysWithSlots.length > 0 ? daysWithSlots : Object.keys(DAY_LABELS).map(k => DAY_LABELS[k]);
  const selectedDaySlots = timetableByDay[selectedDay] || [];

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
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
    return colors[subject] || '#6b7280';
  };

  if (loading) {
    return (
      <SafeAreaView edges={{ top: 'off', bottom: 'additive' }} style={[styles.container, styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading timetable...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={{ top: 'off', bottom: 'additive' }} style={[styles.container, { backgroundColor }]}>
      {/* Day Selector */}
      <View style={[styles.daySelector, { backgroundColor: cardBackground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent}>
          {displayDays.map((day) => (
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

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} />}
      >
        {/* Selected Day Title */}
        <View style={styles.selectedDayHeader}>
          <ThemedText style={[styles.selectedDayTitle, { color: textColor }]}>{selectedDay}</ThemedText>
          <ThemedText style={[styles.selectedDaySubtitle, { color: mutedColor }]}>
            {selectedDaySlots.length} periods
          </ThemedText>
        </View>

        {/* Time Slots */}
        <View style={styles.slotsContainer}>
          {selectedDaySlots.map((slot) => (
            <View key={slot.id} style={[styles.slotCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={[styles.periodIndicator, { backgroundColor: getSubjectColor(slot.subjectName ?? '') }]}>
                <ThemedText style={styles.periodText}>{slot.period}</ThemedText>
              </View>

              <View style={styles.slotContent}>
                <View style={styles.slotHeader}>
                  <ThemedText style={[styles.subjectText, { color: textColor }]}>{slot.subjectName ?? '–'}</ThemedText>
                  <ThemedText style={[styles.timeText, { color: mutedColor }]}>
                    {slot.startTime} – {slot.endTime}
                  </ThemedText>
                </View>

                <View style={styles.slotDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="person" size={14} color={mutedColor} />
                    <ThemedText style={[styles.detailText, { color: mutedColor }]}>{slot.staffName ?? '–'}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <IconSymbol name="location" size={14} color={mutedColor} />
                    <ThemedText style={[styles.detailText, { color: mutedColor }]}>{slot.room ?? '–'}</ThemedText>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
