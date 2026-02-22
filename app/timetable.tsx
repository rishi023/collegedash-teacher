import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getMyTimetable, type TimetableSlotItem } from '@/services/account';
import { storage } from '@/services/storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

function parseTime(t: string): number {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function getCurrentDayAndMinutes(): { dayKey: string; dayLabel: string; minutes: number } {
  const d = new Date();
  const dayNum = d.getDay();
  const dayKey = dayNum === 0 ? 'SATURDAY' : DAY_ORDER[dayNum - 1];
  const dayLabel = DAY_LABELS[dayKey] ?? dayKey;
  const minutes = d.getHours() * 60 + d.getMinutes();
  return { dayKey, dayLabel, minutes };
}

type SlotStatus = 'past' | 'in_progress' | 'upcoming';

function getSlotStatus(slot: TimetableSlotItem, todayKey: string, nowMinutes: number): SlotStatus | null {
  if (slot.dayOfWeek !== todayKey) return null;
  const start = parseTime(slot.startTime ?? '');
  const end = parseTime(slot.endTime ?? '');
  if (nowMinutes < start) return 'upcoming';
  if (nowMinutes >= end) return 'past';
  return 'in_progress';
}

/** Next upcoming slot (today remaining or first future day). */
function getUpcomingSlot(slots: TimetableSlotItem[], todayKey: string, nowMinutes: number): TimetableSlotItem | null {
  const sorted = [...slots].sort((a, b) => {
    const dayA = DAY_ORDER.indexOf(a.dayOfWeek);
    const dayB = DAY_ORDER.indexOf(b.dayOfWeek);
    if (dayA !== dayB) return dayA - dayB;
    return parseTime(a.startTime ?? '') - parseTime(b.startTime ?? '');
  });
  for (const slot of sorted) {
    const dayIdx = DAY_ORDER.indexOf(slot.dayOfWeek);
    const todayIdx = DAY_ORDER.indexOf(todayKey);
    const slotStart = parseTime(slot.startTime ?? '');
    if (dayIdx > todayIdx) return slot;
    if (dayIdx === todayIdx && slotStart > nowMinutes) return slot;
  }
  return null;
}

function getSlotLabel(slot: TimetableSlotItem): string {
  if (slot.slotType === 'LUNCH_BREAK') return 'Lunch';
  if (slot.slotType === 'NO_LECTURE') return 'No lecture';
  return slot.subjectName ?? '–';
}

function getClassLabel(slot: TimetableSlotItem): string {
  const parts = [slot.courseName, slot.year, slot.section].filter(Boolean);
  return parts.join(' · ') || '–';
}

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

  const { dayKey: todayKey, dayLabel: todayLabel, minutes: nowMinutes } = useMemo(() => getCurrentDayAndMinutes(), []);

  const timetableByDay = useMemo(() => {
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

  const upcomingSlot = useMemo(
    () => getUpcomingSlot(slots, todayKey, nowMinutes),
    [slots, todayKey, nowMinutes]
  );

  const todaySlots = timetableByDay[todayLabel] ?? [];
  const todayInProgress = useMemo(
    () => todaySlots.filter((s) => getSlotStatus(s, todayKey, nowMinutes) === 'in_progress'),
    [todaySlots, todayKey, nowMinutes]
  );
  const todayUpcoming = useMemo(
    () => todaySlots.filter((s) => getSlotStatus(s, todayKey, nowMinutes) === 'upcoming'),
    [todaySlots, todayKey, nowMinutes]
  );
  const todayPast = useMemo(
    () => todaySlots.filter((s) => getSlotStatus(s, todayKey, nowMinutes) === 'past'),
    [todaySlots, todayKey, nowMinutes]
  );

  const daysWithSlots = DAY_ORDER.map((d) => DAY_LABELS[d]).filter((d) => (timetableByDay[d]?.length ?? 0) > 0);
  const displayDays = daysWithSlots.length > 0 ? daysWithSlots : Object.keys(DAY_LABELS).map((k) => DAY_LABELS[k]);
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
      Lunch: '#f59e0b',
      'No lecture': '#9ca3af',
    };
    return colors[subject] || '#6b7280';
  };

  const getSlotCardStyle = (status?: SlotStatus) => {
    if (status === 'upcoming') return { backgroundColor: '#fef9c3', borderColor: '#eab308' };
    if (status === 'in_progress') return { backgroundColor: '#dcfce7', borderColor: '#22c55e' };
    if (status === 'past') return { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' };
    return { backgroundColor: cardBackground, borderColor };
  };

  const renderSlotCard = (slot: TimetableSlotItem, showClass?: boolean, status?: SlotStatus) => (
    <View key={slot.id} style={[styles.slotCard, getSlotCardStyle(status)]}>
      <View style={[styles.periodIndicator, { backgroundColor: getSubjectColor(getSlotLabel(slot)) }]}>
        <ThemedText style={styles.periodText}>{slot.period}</ThemedText>
      </View>
      <View style={styles.slotContent}>
        <View style={styles.slotHeader}>
          <ThemedText style={[styles.subjectText, { color: textColor }]}>{getSlotLabel(slot)}</ThemedText>
          <ThemedText style={[styles.timeText, { color: mutedColor }]}>
            {slot.startTime} – {slot.endTime}
          </ThemedText>
        </View>
        {showClass && (slot.courseName || slot.year) && (
          <ThemedText style={[styles.classLabel, { color: mutedColor }]}>{getClassLabel(slot)}</ThemedText>
        )}
        {(slot.slotType === 'LECTURE' || !slot.slotType) && (
          <View style={styles.slotDetails}>
            <View style={styles.detailRow}>
              <IconSymbol name="location" size={14} color={mutedColor} />
              <ThemedText style={[styles.detailText, { color: mutedColor }]}>{slot.room ?? '–'}</ThemedText>
            </View>
          </View>
        )}
        {status === 'in_progress' && (
          <View style={[styles.badge, { backgroundColor: primaryColor + '20' }]}>
            <ThemedText style={[styles.badgeText, { color: primaryColor }]}>In progress</ThemedText>
          </View>
        )}
      </View>
    </View>
  );

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
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} />}
      >
        {/* My upcoming lecture */}
        {upcomingSlot && (
          <View style={[styles.upcomingCard, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '40' }]}>
            <ThemedText style={[styles.upcomingTitle, { color: primaryColor }]}>Upcoming lecture</ThemedText>
            <View style={[styles.slotCard, getSlotCardStyle('upcoming')]}>
              <View style={[styles.periodIndicator, { backgroundColor: getSubjectColor(getSlotLabel(upcomingSlot)) }]}>
                <ThemedText style={styles.periodText}>{upcomingSlot.period}</ThemedText>
              </View>
              <View style={styles.slotContent}>
                <ThemedText style={[styles.subjectText, { color: textColor }]}>{getSlotLabel(upcomingSlot)}</ThemedText>
                <ThemedText style={[styles.classLabel, { color: mutedColor }]}>{getClassLabel(upcomingSlot)}</ThemedText>
                <View style={styles.detailRow}>
                  <IconSymbol name="location" size={14} color={mutedColor} />
                  <ThemedText style={[styles.detailText, { color: mutedColor }]}>{upcomingSlot.room ?? '–'}</ThemedText>
                </View>
                <ThemedText style={[styles.timeText, { color: mutedColor }]}>
                  {DAY_LABELS[upcomingSlot.dayOfWeek]} · {upcomingSlot.startTime} – {upcomingSlot.endTime}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Today: In progress / Upcoming / Past */}
        {todaySlots.length > 0 && (
          <View style={styles.todaySection}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Today — {todayLabel}</ThemedText>
            {todayInProgress.length > 0 && (
              <View style={styles.subSection}>
                <ThemedText style={[styles.subSectionTitle, { color: primaryColor }]}>In progress</ThemedText>
                {todayInProgress.map((s) => renderSlotCard(s, true, 'in_progress'))}
              </View>
            )}
            {todayUpcoming.length > 0 && (
              <View style={styles.subSection}>
                <ThemedText style={[styles.subSectionTitle, { color: mutedColor }]}>Upcoming</ThemedText>
                {todayUpcoming.map((s) => renderSlotCard(s, true, 'upcoming'))}
              </View>
            )}
            {todayPast.length > 0 && (
              <View style={styles.subSection}>
                <ThemedText style={[styles.subSectionTitle, { color: mutedColor }]}>Past</ThemedText>
                {todayPast.map((s) => renderSlotCard(s, true, 'past'))}
              </View>
            )}
          </View>
        )}

        {/* Day Selector */}
        <View style={[styles.daySelector, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>My timetable by day</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent}>
            {displayDays.map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, selectedDay === day && { backgroundColor: primaryColor + '20', borderColor: primaryColor }]}
                onPress={() => setSelectedDay(day)}
              >
                <ThemedText style={[styles.dayButtonText, { color: selectedDay === day ? primaryColor : mutedColor }]}>
                  {day.substring(0, 3)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.selectedDayHeader}>
          <ThemedText style={[styles.selectedDayTitle, { color: textColor }]}>{selectedDay}</ThemedText>
          <ThemedText style={[styles.selectedDaySubtitle, { color: mutedColor }]}>{selectedDaySlots.length} periods</ThemedText>
        </View>

        <View style={styles.slotsContainer}>
          {selectedDaySlots.map((slot) => {
            const status = selectedDay === todayLabel ? getSlotStatus(slot, todayKey, nowMinutes) : undefined;
            return renderSlotCard(slot, true, status ?? undefined);
          })}
          {selectedDaySlots.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="calendar" size={48} color={mutedColor} />
              <ThemedText style={[styles.emptyStateText, { color: mutedColor }]}>No classes scheduled</ThemedText>
              <ThemedText style={[styles.emptyStateSubtext, { color: mutedColor }]}>No classes for {selectedDay}</ThemedText>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  upcomingCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  upcomingTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  todaySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  subSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  daySelector: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayScrollContent: {
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
  classLabel: {
    fontSize: 12,
    marginBottom: 4,
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
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
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
