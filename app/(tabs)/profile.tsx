import { ThemedText } from '@/components/ThemedText'
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { changePassword, getStaffProfile, StaffProfile } from '@/services/account'
import { APP_INFO } from '@/constants'

interface ActionButton {
  title: string
  icon: IconSymbolName
  color: string
  action: () => void
}

interface ProfileSection {
  title: string
  items: {
    label: string
    value: string
    icon: IconSymbolName
  }[]
}

export default function ProfileScreen() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const primaryColor = useThemeColor({}, 'primary')
  const { logout } = useAuth()

  const [imageError, setImageError] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    fetchStaffProfile()
  }, [])

  const fetchStaffProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const response = await getStaffProfile()
      if (response?.responseObject) {
        setStaffProfile(response.responseObject)
      }
    } catch (error) {
      console.error('Error fetching staff profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // const handleEditProfile = () => {
  //   Alert.alert(
  //     'Edit Profile',
  //     'Profile editing functionality will be available once connected to the API.',
  //     [{ text: 'OK' }]
  //   )
  // }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout()
            router.replace('/login')
          } catch (error) {
            console.error('Logout error:', error)
            Alert.alert('Error', 'Failed to logout. Please try again.')
          }
        },
      },
    ])
  }

  const handleChangePassword = () => {
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long')
      return
    }

    try {
      setIsChangingPassword(true)
      const response = await changePassword({
        oldPassword,
        newPassword,
      })

      if (response?.responseObject === true) {
        Alert.alert('Success', 'Password changed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowPasswordModal(false)
              setOldPassword('')
              setNewPassword('')
              setConfirmPassword('')
            },
          },
        ])
      } else {
        Alert.alert('Error', response?.apiResponseStatus?.message || 'Failed to change password')
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to change password. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleCancelPasswordChange = () => {
    setShowPasswordModal(false)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const formatBloodGroup = (bloodGrp?: string) => {
    if (!bloodGrp) return 'N/A'
    const mapping: Record<string, string> = {
      O_POS: 'O+',
      O_NEG: 'O-',
      A_POS: 'A+',
      A_NEG: 'A-',
      B_POS: 'B+',
      B_NEG: 'B-',
      AB_POS: 'AB+',
      AB_NEG: 'AB-',
    }
    return mapping[bloodGrp] || bloodGrp
  }

  const formatGender = (gender?: string) => {
    if (!gender) return 'N/A'
    return gender.charAt(0) + gender.slice(1).toLowerCase()
  }

  const fullName = staffProfile
    ? `${staffProfile.firstName || ''} ${staffProfile.lastNme || ''}`.trim()
    : 'N/A'

  const profileSections: ProfileSection[] = [
    {
      title: 'Personal Information',
      items: [
        { label: 'Name', value: fullName, icon: 'person.fill' },
        { label: 'Email', value: staffProfile?.email || 'N/A', icon: 'envelope.fill' },
        { label: 'Mobile', value: staffProfile?.mobileNo || 'N/A', icon: 'phone.fill' },
        {
          label: 'Date of Birth',
          value: formatDate(staffProfile?.dob),
          icon: 'calendar',
        },
        { label: 'Gender', value: formatGender(staffProfile?.gender), icon: 'person.fill' },
        {
          label: 'Blood Group',
          value: formatBloodGroup(staffProfile?.bloodGrp),
          icon: 'heart.fill',
        },
        {
          label: 'Marital Status',
          value: staffProfile?.married
            ? staffProfile.married.charAt(0) + staffProfile.married.slice(1).toLowerCase()
            : 'N/A',
          icon: 'heart.fill',
        },
      ],
    },
    {
      title: 'Employment Details',
      items: [
        { label: 'Employee Code', value: staffProfile?.empCode || 'N/A', icon: 'number' },
        { label: 'Role', value: staffProfile?.role || 'N/A', icon: 'briefcase.fill' },
        {
          label: 'Date of Joining',
          value: formatDate(staffProfile?.doj),
          icon: 'calendar',
        },
        {
          label: 'Job Status',
          value: staffProfile?.jobStatus
            ? staffProfile.jobStatus.charAt(0) + staffProfile.jobStatus.slice(1).toLowerCase()
            : 'N/A',
          icon: 'checkmark.circle.fill',
        },
        {
          label: 'Job Type',
          value: staffProfile?.jobType
            ? staffProfile.jobType.charAt(0) + staffProfile.jobType.slice(1).toLowerCase()
            : 'N/A',
          icon: 'doc.text.fill',
        },
      ],
    },
    {
      title: 'Qualifications',
      items: [
        {
          label: 'Qualification',
          value: staffProfile?.qualification || 'N/A',
          icon: 'graduationcap.fill',
        },
        {
          label: 'Degree',
          value: staffProfile?.degree
            ? staffProfile.degree.charAt(0) + staffProfile.degree.slice(1).toLowerCase()
            : 'N/A',
          icon: 'doc.fill',
        },
      ],
    },
    {
      title: 'Address',
      items: [
        {
          label: 'Address',
          value: staffProfile?.caddress?.addLineOne || 'N/A',
          icon: 'house.fill',
        },
        { label: 'District', value: staffProfile?.caddress?.district || 'N/A', icon: 'mappin' },
        { label: 'State', value: staffProfile?.caddress?.state || 'N/A', icon: 'map' },
        { label: 'Pin Code', value: staffProfile?.caddress?.pinCode || 'N/A', icon: 'number' },
      ],
    },
  ]

  const actionButtons: ActionButton[] = [
    // {
    //   title: 'Edit Profile',
    //   icon: 'pencil',
    //   color: '#2563eb',
    //   action: handleEditProfile,
    // },
    {
      title: 'Change Password',
      icon: 'lock.fill',
      color: '#059669',
      action: handleChangePassword,
    },
    {
      title: 'Logout',
      icon: 'arrow.right.square.fill',
      color: '#ef4444',
      action: handleLogout,
    },
  ]

  return (
    <SafeAreaView
      edges={{ top: 'additive', bottom: 'off' }}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : (
          <>
            <View style={[styles.profileHeader, {}]}>
              <View style={styles.avatarContainer}>
                {staffProfile?.imageUrl && !imageError ? (
                  <Image
                    source={{ uri: staffProfile.imageUrl }}
                    style={styles.avatar}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: mutedColor }]}>
                    <IconSymbol name="person.fill" size={48} color="#ffffff" />
                  </View>
                )}
              </View>
              <ThemedText style={[styles.staffName, { color: textColor }]}>{fullName}</ThemedText>
              <ThemedText style={[styles.staffRole, { color: mutedColor }]}>
                {staffProfile?.role || 'Teacher'}
              </ThemedText>
              <ThemedText style={[styles.staffEmail, { color: mutedColor }]}>
                {staffProfile?.email || 'N/A'}
              </ThemedText>
            </View>

            {profileSections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                  {section.title}
                </ThemedText>
                <View style={[styles.sectionContent, { backgroundColor: cardBackground }]}>
                  {section.items.map((item, itemIndex) => (
                    <View
                      key={itemIndex}
                      style={[
                        styles.infoRow,
                        { borderBottomColor: borderColor },
                        itemIndex === section.items.length - 1 && styles.lastActionButton,
                      ]}
                    >
                      <View style={styles.infoLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
                          <IconSymbol name={item.icon} size={16} color={mutedColor} />
                        </View>
                        <ThemedText style={[styles.infoLabel, { color: mutedColor }]}>
                          {item.label}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.infoValue, { color: textColor }]}>
                        {item.value}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.actionsSection}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Actions</ThemedText>
              <View style={[styles.actionsContent, { backgroundColor: cardBackground }]}>
                {actionButtons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      { borderBottomColor: borderColor },
                      index === actionButtons.length - 1 && styles.lastActionButton,
                    ]}
                    onPress={button.action}
                  >
                    <View style={styles.actionLeft}>
                      <View
                        style={[
                          styles.actionIconContainer,
                          { backgroundColor: `${button.color}20` },
                        ]}
                      >
                        <IconSymbol name={button.icon} size={20} color={button.color} />
                      </View>
                      <ThemedText style={[styles.actionTitle, { color: textColor }]}>
                        {button.title}
                      </ThemedText>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.appInfo}>
              <ThemedText style={[styles.appInfoText, { color: mutedColor }]}>
                {APP_INFO.NAME} Teacher App v1.0.0
              </ThemedText>
              <ThemedText style={[styles.appInfoSubtext, { color: mutedColor }]}>
                School Management System
              </ThemedText>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelPasswordChange}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>
              Change Password
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText style={[styles.inputLabel, { color: mutedColor }]}>
                Old Password
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor, borderColor, color: textColor }]}
                placeholder="Enter old password"
                placeholderTextColor={mutedColor}
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
                editable={!isChangingPassword}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={[styles.inputLabel, { color: mutedColor }]}>
                New Password
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor, borderColor, color: textColor }]}
                placeholder="Enter new password"
                placeholderTextColor={mutedColor}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!isChangingPassword}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={[styles.inputLabel, { color: mutedColor }]}>
                Confirm New Password
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor, borderColor, color: textColor }]}
                placeholder="Confirm new password"
                placeholderTextColor={mutedColor}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isChangingPassword}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor }]}
                onPress={handleCancelPasswordChange}
                disabled={isChangingPassword}
              >
                <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: primaryColor }]}
                onPress={handlePasswordSubmit}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>Change Password</ThemedText>
                )}
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
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  staffName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 16,
    marginBottom: 2,
  },
  staffEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '50%',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionsContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  lastActionButton: {
    borderBottomWidth: 0,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    minHeight: 48,
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
})
