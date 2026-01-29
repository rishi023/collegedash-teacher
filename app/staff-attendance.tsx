import { ThemedText } from '@/components/ThemedText'
import StaffAttendanceReport from '@/components/attendance/StaffAttendanceReport'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { OFFICE_LOCATION } from '@/constants'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  getStaffAttendanceByDate,
  getStaffProfile,
  markStaffAttendance,
  StaffAttendancePayload,
  updateStaffAttendance,
} from '@/services/account'
import { storage } from '@/services/storage'
import * as Location from 'expo-location'
import { getDistance } from 'geolib'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type TabType = 'mark' | 'report'

interface LocationState {
  latitude: number
  longitude: number
  accuracy: number | null
}

export default function SelfAttendanceScreen() {
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

  // Location state
  const [location, setLocation] = useState<LocationState | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Attendance form state
  const [attendanceDate, setAttendanceDate] = useState(formatDate(new Date()))
  const [inTime, setInTime] = useState('')
  const [outTime, setOutTime] = useState('')
  const [remarks, setRemarks] = useState('')

  // Existing attendance state
  const [existingAttendanceId, setExistingAttendanceId] = useState<string | null>(null)
  const [fetchingAttendance, setFetchingAttendance] = useState(false)

  // Location check
  const isWithinRadius = distance !== null && distance <= OFFICE_LOCATION.radius
  const canMarkAttendance = isWithinRadius && location !== null && !isLoadingLocation

  useEffect(() => {
    loadStaffData()
    getCurrentLocation()
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

  function getCurrentTimeString(): string {
    const now = new Date()
    let hours = now.getHours()
    const minutes = now.getMinutes()
    const period = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`
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

        // Fetch today's attendance after getting staff ID
        await fetchTodayAttendance(profile.id)
      }
    } catch (error) {
      console.error('Error loading staff data:', error)
      Alert.alert('Error', 'Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayAttendance = async (staffIdParam?: string) => {
    const id = staffIdParam || staffId
    if (!id) return

    setFetchingAttendance(true)
    try {
      const today = formatDate(new Date())
      const res = await getStaffAttendanceByDate(today)

      if (res?.responseObject && res.responseObject.length > 0) {
        // Filter to find current staff's attendance record
        const attendance = res.responseObject.find((record) => record.staffId === id)

        if (attendance && attendance.id) {
          // Attendance already marked for today (has id)
          setExistingAttendanceId(attendance.id)
          setInTime(attendance.inTime || '')
          setOutTime(attendance.outTime || '')
          setRemarks(attendance.remarks || '')
        } else {
          // No attendance marked yet (id is null or record not found)
          setExistingAttendanceId(null)
          setInTime('')
          setOutTime('')
          setRemarks('')
        }
      } else {
        // No attendance for today
        setExistingAttendanceId(null)
        setInTime('')
        setOutTime('')
        setRemarks('')
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error)
    } finally {
      setFetchingAttendance(false)
    }
  }

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true)
    setLocationError(null)
    setLocation(null)
    setDistance(null)

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setLocationError('Location permission denied')
        setIsLoadingLocation(false)
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const { latitude, longitude, accuracy } = currentLocation.coords
      setLocation({ latitude, longitude, accuracy })

      // Calculate distance from office
      const distanceFromOffice = getDistance(
        { latitude, longitude },
        { latitude: OFFICE_LOCATION.latitude, longitude: OFFICE_LOCATION.longitude },
      )

      setDistance(distanceFromOffice)
    } catch (error) {
      console.error('Error getting location:', error)
      setLocationError('Unable to get location')
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([getCurrentLocation(), fetchTodayAttendance()])
    setIsRefreshing(false)
  }

  const getStatusColor = (): string => {
    if (isLoadingLocation) return mutedColor
    if (!location || locationError) return '#ef4444'
    if (isWithinRadius) return '#10b981'
    return '#ef4444'
  }

  const markInNow = () => {
    if (!canMarkAttendance) {
      if (!location) {
        Alert.alert('Location Required', 'Please enable location services.')
      } else if (!isWithinRadius) {
        Alert.alert(
          'Outside Campus',
          `You are ${distance?.toFixed(0)}m away. Move within ${OFFICE_LOCATION.radius}m.`,
        )
      }
      return
    }

    if (inTime) {
      Alert.alert('Already Marked', 'In-time is already marked for today.')
      return
    }

    setInTime(getCurrentTimeString())
  }

  const markOutNow = () => {
    if (!canMarkAttendance) {
      if (!location) {
        Alert.alert('Location Required', 'Please enable location services.')
      } else if (!isWithinRadius) {
        Alert.alert(
          'Outside Campus',
          `You are ${distance?.toFixed(0)}m away. Move within ${OFFICE_LOCATION.radius}m.`,
        )
      }
      return
    }

    if (!inTime) {
      Alert.alert('Mark In-Time First', 'Please mark your in-time before marking out-time.')
      return
    }

    if (outTime) {
      Alert.alert('Already Marked', 'Out-time is already marked for today.')
      return
    }

    setOutTime(getCurrentTimeString())
  }

  const handleSaveAttendance = async () => {
    if (!canMarkAttendance) {
      if (!location) {
        Alert.alert('Location Required', 'Please enable location services and try again.')
      } else if (!isWithinRadius) {
        Alert.alert(
          'Outside Campus',
          `You are ${distance?.toFixed(0)}m away from campus. Move within ${OFFICE_LOCATION.radius}m to mark attendance.`,
        )
      }
      return
    }

    if (!inTime) {
      Alert.alert('Error', 'Please mark your in-time first by pressing the "In Now" button.')
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
        latitude: location?.latitude,
        longitude: location?.longitude,
      }

      let response

      if (existingAttendanceId) {
        // Update existing attendance (PUT)
        response = await updateStaffAttendance({ ...payload, id: existingAttendanceId })
      } else {
        // Create new attendance (POST)
        response = await markStaffAttendance(payload)
      }

      if (response?.responseObject) {
        const successMessage = existingAttendanceId
          ? 'Attendance updated successfully!'
          : 'Attendance marked successfully!'

        Alert.alert('Success', successMessage, [
          {
            text: 'OK',
            onPress: () => {
              // Refresh to get updated data
              fetchTodayAttendance()
            },
          },
        ])
      } else {
        Alert.alert('Error', response?.message || 'Failed to save attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      Alert.alert('Error', 'Failed to save attendance. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Determine button states
  const canMarkIn = canMarkAttendance && !inTime
  const canMarkOut = canMarkAttendance && inTime && !outTime
  const canSave =
    canMarkAttendance &&
    inTime &&
    (!existingAttendanceId || (existingAttendanceId && !outTime && outTime !== ''))

  // Determine save button text
  const getSaveButtonText = () => {
    if (existingAttendanceId) {
      return outTime ? 'Update Attendance' : 'Save Out Time'
    }
    return 'Save In Time'
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading...</ThemedText>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      {/* Tab Bar */}
      <View
        style={[styles.tabBar, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}
      >
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
            My Report
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'report' ? (
        <StaffAttendanceReport />
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          {/* Location Status Card */}
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.locationHeader}>
              <View
                style={[styles.locationIconContainer, { backgroundColor: `${getStatusColor()}20` }]}
              >
                <IconSymbol name="location.fill" size={24} color={getStatusColor()} />
              </View>
              <View style={styles.locationInfo}>
                <ThemedText style={[styles.locationTitle, { color: textColor }]}>
                  Location Status
                </ThemedText>
                <ThemedText style={[styles.locationStatusText, { color: getStatusColor() }]}>
                  {isLoadingLocation
                    ? 'Detecting location...'
                    : locationError
                      ? locationError
                      : !location
                        ? 'Location not available'
                        : isWithinRadius
                          ? 'Within campus - Ready'
                          : `Outside campus (${distance?.toFixed(0)}m away)`}
                </ThemedText>
              </View>
            </View>

            {/* Current Location Panel */}
            <View
              style={[
                styles.locationPanel,
                { backgroundColor: `${getStatusColor()}10`, borderColor: getStatusColor() },
              ]}
            >
              <ThemedText style={[styles.locationPanelTitle, { color: textColor }]}>
                Current Location
              </ThemedText>
              <ThemedText
                style={[styles.locationLine, { color: location ? textColor : '#ef4444' }]}
              >
                {location
                  ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`
                  : 'NOT DETECTED'}
              </ThemedText>
              <ThemedText
                style={[styles.locationLine, { color: isWithinRadius ? '#10b981' : '#ef4444' }]}
              >
                Distance: {distance !== null ? `${distance.toFixed(0)}m` : 'N/A'} (Allowed:{' '}
                {OFFICE_LOCATION.radius}m)
              </ThemedText>
              <ThemedText
                style={[
                  styles.locationLine,
                  { color: canMarkAttendance ? '#10b981' : '#ef4444', fontWeight: '600' },
                ]}
              >
                Status: {canMarkAttendance ? 'Ready to mark attendance' : 'Cannot mark attendance'}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.refreshLocationButton, { borderColor }]}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <>
                  <IconSymbol name="arrow.clockwise" size={16} color={primaryColor} />
                  <ThemedText style={[styles.refreshLocationText, { color: primaryColor }]}>
                    Refresh Location
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

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

          {/* Attendance Status Card */}
          {fetchingAttendance ? (
            <View style={[styles.card, { backgroundColor: cardBackground }]}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.fetchingText, { color: mutedColor }]}>
                Checking today's attendance...
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                {existingAttendanceId ? "Today's Attendance" : 'Mark Attendance'}
              </ThemedText>

              {existingAttendanceId && (
                <View style={[styles.statusBadge, { backgroundColor: successColor + '20' }]}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={successColor} />
                  <ThemedText style={[styles.statusBadgeText, { color: successColor }]}>
                    Attendance already marked for today
                  </ThemedText>
                </View>
              )}

              {/* In Time Row */}
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <ThemedText style={[styles.label, { color: textColor }]}>In Time</ThemedText>
                  <View
                    style={[
                      styles.timeDisplay,
                      {
                        backgroundColor,
                        borderColor: inTime ? successColor : borderColor,
                      },
                    ]}
                  >
                    <IconSymbol name="clock.fill" size={18} color={successColor} />
                    <ThemedText
                      style={[styles.timeText, { color: inTime ? textColor : mutedColor }]}
                    >
                      {inTime || 'Not marked'}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.nowButton,
                    { backgroundColor: canMarkIn ? successColor : mutedColor },
                  ]}
                  onPress={markInNow}
                  disabled={!canMarkIn}
                >
                  <ThemedText style={styles.nowButtonText}>In Now</ThemedText>
                </TouchableOpacity>
              </View>

              {/* Out Time Row */}
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <ThemedText style={[styles.label, { color: textColor }]}>Out Time</ThemedText>
                  <View
                    style={[
                      styles.timeDisplay,
                      {
                        backgroundColor,
                        borderColor: outTime ? errorColor : borderColor,
                      },
                    ]}
                  >
                    <IconSymbol name="clock.fill" size={18} color={errorColor} />
                    <ThemedText
                      style={[styles.timeText, { color: outTime ? textColor : mutedColor }]}
                    >
                      {outTime || 'Not marked'}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.nowButton,
                    { backgroundColor: canMarkOut ? errorColor : mutedColor },
                  ]}
                  onPress={markOutNow}
                  disabled={!canMarkOut}
                >
                  <ThemedText style={styles.nowButtonText}>Out Now</ThemedText>
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
                  editable={canMarkAttendance}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: canMarkAttendance && inTime ? primaryColor : mutedColor,
                  },
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSaveAttendance}
                disabled={submitting || !canMarkAttendance || !inTime}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                    <ThemedText style={styles.submitButtonText}>{getSaveButtonText()}</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: primaryColor + '10' }]}>
            <IconSymbol name="info.circle.fill" size={20} color={primaryColor} />
            <View style={styles.infoTextContainer}>
              <ThemedText style={[styles.infoText, { color: textColor }]}>
                How to mark attendance:
              </ThemedText>
              <ThemedText style={[styles.infoStep, { color: mutedColor }]}>
                1. When arriving: Press "In Now" then "Save In Time"
              </ThemedText>
              <ThemedText style={[styles.infoStep, { color: mutedColor }]}>
                2. When leaving: Press "Out Now" then "Save Out Time"
              </ThemedText>
              <ThemedText style={[styles.infoNote, { color: mutedColor }]}>
                You must be within {OFFICE_LOCATION.radius}m of campus.
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      )}
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
  fetchingText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  // Location styles
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationStatusText: {
    fontSize: 14,
  },
  locationPanel: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationPanelTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  locationLine: {
    fontSize: 12,
    marginBottom: 4,
  },
  refreshLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  refreshLocationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Staff info styles
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '500',
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
  timeDisplay: {
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
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoStep: {
    fontSize: 13,
    lineHeight: 20,
  },
  infoNote: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
})
