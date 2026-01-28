import { ThemedText } from '@/components/ThemedText'
import StaffAttendanceReport from '@/components/attendance/StaffAttendanceReport'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  getStaffProfile,
  markStaffAttendance,
  StaffAttendancePayload,
} from '@/services/account'
import { storage } from '@/services/storage'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type TabType = 'mark' | 'report'

export default function StaffAttendanceScreen() {
  // Theme colors
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const successColor = useThemeColor({}, 'success')
  const errorColor = useThemeColor({}, 'error')

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('mark')

  // State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [staffId, setStaffId] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [staffName, setStaffName] = useState('')
  const [staffCode, setStaffCode] = useState('')

  // Attendance form state
  const [attendanceDate, setAttendanceDate] = useState(formatDate(new Date()))
  const [inTime, setInTime] = useState('')
  const [outTime, setOutTime] = useState('')
  const [remarks, setRemarks] = useState('')

  // Time picker modal state
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [timePickerField, setTimePickerField] = useState<'in' | 'out'>('in')
  const [selectedHour, setSelectedHour] = useState('09')
  const [selectedMinute, setSelectedMinute] = useState('00')
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM')

  useEffect(() => {
    loadStaffData()
  }, [])

  function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function formatDisplayDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const loadStaffData = async () => {
    try {
      setLoading(true)

      // Get user data from storage
      const userData = await storage.getUserData()
      if (userData?.institutionIds?.[0]) {
        setInstitutionId(userData.institutionIds[0])
      }

      // Get staff profile
      const profileRes = await getStaffProfile()
      if (profileRes?.responseObject) {
        const profile = profileRes.responseObject
        setStaffId(profile.id)
        setStaffName(`${profile.firstName || ''} ${profile.lastNme || ''}`.trim())
        setStaffCode(profile.empCode || '')
      }
    } catch (error) {
      console.error('Error loading staff data:', error)
      Alert.alert('Error', 'Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }

  const openTimePicker = (field: 'in' | 'out') => {
    setTimePickerField(field)
    const currentTime = field === 'in' ? inTime : outTime

    if (currentTime) {
      // Parse existing time
      const match = currentTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
      if (match) {
        setSelectedHour(match[1].padStart(2, '0'))
        setSelectedMinute(match[2])
        setSelectedPeriod(match[3].toUpperCase() as 'AM' | 'PM')
      }
    } else {
      // Set defaults
      if (field === 'in') {
        setSelectedHour('09')
        setSelectedMinute('00')
        setSelectedPeriod('AM')
      } else {
        setSelectedHour('05')
        setSelectedMinute('00')
        setSelectedPeriod('PM')
      }
    }

    setShowTimePicker(true)
  }

  const confirmTime = () => {
    const timeString = `${selectedHour}:${selectedMinute} ${selectedPeriod}`
    if (timePickerField === 'in') {
      setInTime(timeString)
    } else {
      setOutTime(timeString)
    }
    setShowTimePicker(false)
  }

  const handleMarkAttendance = async () => {
    if (!inTime) {
      Alert.alert('Error', 'Please select in-time')
      return
    }

    if (!staffId || !institutionId) {
      Alert.alert('Error', 'Staff information not loaded. Please try again.')
      return
    }

    setSubmitting(true)

    try {
      const payload: StaffAttendancePayload = {
        staffId,
        institutionId,
        name: staffName,
        code: staffCode,
        inTime,
        outTime: outTime || '',
        attendanceDate,
        remarks: remarks.trim(),
      }

      const response = await markStaffAttendance(payload)

      if (response?.responseObject) {
        Alert.alert('Success', 'Attendance marked successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form for next entry
              setRemarks('')
            },
          },
        ])
      } else {
        Alert.alert('Error', response?.message || 'Failed to mark attendance')
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      Alert.alert('Error', 'Failed to mark attendance. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const markInNow = () => {
    const now = new Date()
    let hours = now.getHours()
    const minutes = now.getMinutes()
    const period = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    setInTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`)
  }

  const markOutNow = () => {
    const now = new Date()
    let hours = now.getHours()
    const minutes = now.getMinutes()
    const period = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    setOutTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`)
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
          Loading staff data...
        </ThemedText>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'mark' && { borderBottomColor: primaryColor, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('mark')}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'mark' ? primaryColor : mutedColor },
              activeTab === 'mark' && styles.tabTextActive,
            ]}
          >
            Mark Attendance
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'report' && { borderBottomColor: primaryColor, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('report')}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'report' ? primaryColor : mutedColor },
              activeTab === 'report' && styles.tabTextActive,
            ]}
          >
            Staff Report
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'report' ? (
        <StaffAttendanceReport />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Staff Info Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <View style={styles.staffInfoHeader}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: primaryColor + '20' }]}>
              <IconSymbol name="person.fill" size={32} color={primaryColor} />
            </View>
            <View style={styles.staffDetails}>
              <ThemedText style={[styles.staffName, { color: textColor }]}>
                {staffName || 'N/A'}
              </ThemedText>
              <ThemedText style={[styles.staffCode, { color: mutedColor }]}>
                Employee Code: {staffCode || 'N/A'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Date Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Attendance Date
          </ThemedText>
          <View style={[styles.dateDisplay, { backgroundColor, borderColor }]}>
            <IconSymbol name="calendar" size={20} color={primaryColor} />
            <ThemedText style={[styles.dateText, { color: textColor }]}>
              {formatDisplayDate(attendanceDate)}
            </ThemedText>
          </View>
        </View>

        {/* Time Entry Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Mark Attendance
          </ThemedText>

          {/* In Time */}
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <ThemedText style={[styles.label, { color: textColor }]}>In Time *</ThemedText>
              <TouchableOpacity
                style={[styles.timeInput, { backgroundColor, borderColor }]}
                onPress={() => openTimePicker('in')}
              >
                <IconSymbol name="clock.fill" size={18} color={successColor} />
                <ThemedText
                  style={[styles.timeText, { color: inTime ? textColor : mutedColor }]}
                >
                  {inTime || 'Select Time'}
                </ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.nowButton, { backgroundColor: successColor }]}
              onPress={markInNow}
            >
              <ThemedText style={styles.nowButtonText}>Now</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Out Time */}
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <ThemedText style={[styles.label, { color: textColor }]}>Out Time</ThemedText>
              <TouchableOpacity
                style={[styles.timeInput, { backgroundColor, borderColor }]}
                onPress={() => openTimePicker('out')}
              >
                <IconSymbol name="clock.fill" size={18} color={errorColor} />
                <ThemedText
                  style={[styles.timeText, { color: outTime ? textColor : mutedColor }]}
                >
                  {outTime || 'Select Time'}
                </ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.nowButton, { backgroundColor: errorColor }]}
              onPress={markOutNow}
            >
              <ThemedText style={styles.nowButtonText}>Now</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Remarks */}
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              Remarks (Optional)
            </ThemedText>
            <TextInput
              style={[styles.remarksInput, { backgroundColor, borderColor, color: textColor }]}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Enter any remarks..."
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: primaryColor },
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleMarkAttendance}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                <ThemedText style={styles.submitButtonText}>Mark Attendance</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: primaryColor + '10' }]}>
          <IconSymbol name="info.circle.fill" size={20} color={primaryColor} />
          <ThemedText style={[styles.infoText, { color: textColor }]}>
            You can mark your in-time when you arrive and update with out-time when you leave.
          </ThemedText>
        </View>
      </ScrollView>
      )}

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>
              Select {timePickerField === 'in' ? 'In' : 'Out'} Time
            </ThemedText>

            <View style={styles.pickerContainer}>
              {/* Hour Picker */}
              <View style={styles.pickerColumn}>
                <ThemedText style={[styles.pickerLabel, { color: mutedColor }]}>Hour</ThemedText>
                <ScrollView
                  style={[styles.pickerScroll, { borderColor }]}
                  showsVerticalScrollIndicator={false}
                >
                  {hours.map(hour => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        selectedHour === hour && { backgroundColor: primaryColor + '20' },
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <ThemedText
                        style={[
                          styles.pickerItemText,
                          { color: selectedHour === hour ? primaryColor : textColor },
                          selectedHour === hour && styles.pickerItemTextSelected,
                        ]}
                      >
                        {hour}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minute Picker */}
              <View style={styles.pickerColumn}>
                <ThemedText style={[styles.pickerLabel, { color: mutedColor }]}>Minute</ThemedText>
                <ScrollView
                  style={[styles.pickerScroll, { borderColor }]}
                  showsVerticalScrollIndicator={false}
                >
                  {minutes.map(minute => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        selectedMinute === minute && { backgroundColor: primaryColor + '20' },
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <ThemedText
                        style={[
                          styles.pickerItemText,
                          { color: selectedMinute === minute ? primaryColor : textColor },
                          selectedMinute === minute && styles.pickerItemTextSelected,
                        ]}
                      >
                        {minute}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AM/PM Picker */}
              <View style={styles.pickerColumn}>
                <ThemedText style={[styles.pickerLabel, { color: mutedColor }]}>Period</ThemedText>
                <View style={[styles.periodPicker, { borderColor }]}>
                  {(['AM', 'PM'] as const).map(period => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.periodItem,
                        selectedPeriod === period && { backgroundColor: primaryColor },
                      ]}
                      onPress={() => setSelectedPeriod(period)}
                    >
                      <ThemedText
                        style={[
                          styles.periodItemText,
                          { color: selectedPeriod === period ? '#fff' : textColor },
                        ]}
                      >
                        {period}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor }]}
                onPress={() => setShowTimePicker(false)}
              >
                <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={confirmTime}
              >
                <ThemedText style={styles.confirmButtonText}>Confirm</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  tabTextActive: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  staffInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffDetails: {
    marginLeft: 16,
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  staffCode: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 15,
    marginLeft: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  timeField: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 16,
    marginLeft: 10,
  },
  nowButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 0,
  },
  nowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  remarksInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  pickerScroll: {
    height: 150,
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 16,
  },
  pickerItemTextSelected: {
    fontWeight: '600',
  },
  periodPicker: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  periodItem: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  periodItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {},
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
})
