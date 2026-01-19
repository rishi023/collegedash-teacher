import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Attendance } from '@/services/dummyData';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface CalendarDay {
  day: number;
  date: string;
  attendance: Attendance[];
}

interface AttendanceCalendarProps {
  currentDate: Date;
  attendanceByDate: Record<string, Attendance[]>;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

export default function AttendanceCalendar({ currentDate, attendanceByDate, onMonthChange }: AttendanceCalendarProps) {
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'muted');

  const generateCalendarDays = (): (CalendarDay | null)[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (CalendarDay | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        day,
        date: dateString,
        attendance: attendanceByDate[dateString] || [],
      });
    }

    return days;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return '#10b981';
      case 'Absent':
        return '#ef4444';
      case 'Leave':
        return '#8b5cf6';
      case 'Holiday':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  const getDayStatus = (attendance: Attendance[]) => {
    if (attendance.length === 0) return null;
    if (attendance.some((a) => a.status === 'Holiday')) return 'Holiday';
    if (attendance.some((a) => a.status === 'Absent')) return 'Absent';
    if (attendance.some((a) => a.status === 'Leave')) return 'Leave';
    return 'Present';
  };

  const getAttendanceColor = (attendance: Attendance[]) => {
    const status = getDayStatus(attendance);
    return status ? getStatusColor(status) : 'transparent';
  };

  const calendarDays = generateCalendarDays();
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      {/* Month Navigation */}
      <View style={[styles.monthSelector, { backgroundColor: cardBackground }]}>
        <TouchableOpacity onPress={() => onMonthChange('prev')}>
          <IconSymbol name="chevron.left" size={20} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.monthText, { color: textColor }]}>{monthYear}</ThemedText>
        <TouchableOpacity onPress={() => onMonthChange('next')}>
          <IconSymbol name="chevron.right" size={20} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={[styles.calendar, { backgroundColor: cardBackground }]}>
        {/* Calendar header with day names */}
        <View style={styles.weekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <View key={day} style={styles.dayHeader}>
              <ThemedText style={[styles.dayHeaderText, { color: mutedColor }]}>{day}</ThemedText>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((dayData, index) => (
            <View key={index} style={styles.dayCell}>
              {dayData ? (
                <View
                  style={[
                    styles.dayContent,
                    dayData.attendance.length > 0 && {
                      backgroundColor: getAttendanceColor(dayData.attendance) + '20',
                      borderColor: getAttendanceColor(dayData.attendance),
                      borderWidth: 2,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dayNumber,
                      {
                        color: dayData.attendance.length > 0 ? getAttendanceColor(dayData.attendance) : textColor,
                      },
                    ]}
                  >
                    {dayData.day}
                  </ThemedText>
                  {dayData.attendance.length > 0 && (
                    <View style={[styles.statusDot, { backgroundColor: getAttendanceColor(dayData.attendance) }]} />
                  )}
                </View>
              ) : (
                <View style={styles.emptyDay} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: cardBackground }]}>
        <ThemedText style={[styles.legendTitle, { color: textColor }]}>Legend</ThemedText>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getStatusColor('Present') }]} />
            <ThemedText style={[styles.legendText, { color: mutedColor }]}>Present</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getStatusColor('Absent') }]} />
            <ThemedText style={[styles.legendText, { color: mutedColor }]}>Absent</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getStatusColor('Leave') }]} />
            <ThemedText style={[styles.legendText, { color: mutedColor }]}>Leave</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getStatusColor('Holiday') }]} />
            <ThemedText style={[styles.legendText, { color: mutedColor }]}>Holiday</ThemedText>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendar: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyDay: {
    flex: 1,
  },
  legend: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 10,
  },
});
