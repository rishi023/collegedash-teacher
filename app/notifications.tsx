import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Notification, dummyNotifications } from '@/services/dummyData'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function NotificationsScreen() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')

  const [selectedFilter, setSelectedFilter] = useState<string>('All')

  const filters = ['All', 'Unread', 'Read', 'Important']

  const filteredNotifications =
    selectedFilter === 'All'
      ? dummyNotifications
      : selectedFilter === 'Important'
        ? dummyNotifications.filter(notification => notification.priority === 'High')
        : dummyNotifications.filter(notification => notification.status === selectedFilter)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Assignment':
        return 'doc.text'
      case 'Announcement':
        return 'bell.fill'
      case 'Fee':
        return 'creditcard.fill'
      case 'Exam':
        return 'graduationcap.fill'
      case 'Holiday':
        return 'calendar'
      case 'Event':
        return 'star.fill'
      default:
        return 'info.circle.fill'
    }
  }

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'Assignment':
        return '#3b82f6'
      case 'Announcement':
        return '#f59e0b'
      case 'Fee':
        return '#ef4444'
      case 'Exam':
        return '#8b5cf6'
      case 'Holiday':
        return '#10b981'
      case 'Event':
        return '#f59e0b'
      default:
        return primaryColor
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#ef4444'
      case 'Medium':
        return '#f59e0b'
      case 'Low':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const markAsRead = (notificationId: string) => {
    // In a real app, this would update the backend
    console.log('Mark notification as read:', notificationId)
  }

  const deleteNotification = (notificationId: string) => {
    // In a real app, this would delete from backend
    console.log('Delete notification:', notificationId)
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays}d ago`

    return notificationDate.toLocaleDateString()
  }

  const renderNotificationCard = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        {
          backgroundColor: cardBackground,
          borderColor,
          opacity: notification.status === 'Read' ? 0.7 : 1,
        },
      ]}
      onPress={() => markAsRead(notification.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <IconSymbol
            name={getNotificationIcon(notification.type)}
            size={20}
            color={getNotificationIconColor(notification.type)}
          />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <ThemedText style={[styles.notificationTitle, { color: textColor }]}>
              {notification.title}
            </ThemedText>
            {notification.status === 'Unread' && <View style={styles.unreadDot} />}
          </View>

          <ThemedText style={[styles.notificationType, { color: primaryColor }]}>
            {notification.type}
          </ThemedText>

          <ThemedText style={[styles.notificationMessage, { color: mutedColor }]}>
            {notification.message}
          </ThemedText>

          <View style={styles.notificationFooter}>
            <ThemedText style={[styles.notificationTime, { color: mutedColor }]}>
              {formatRelativeTime(notification.date)}
            </ThemedText>

            <View style={styles.priorityAndActions}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(notification.priority) },
                ]}
              >
                <ThemedText style={styles.priorityText}>{notification.priority}</ThemedText>
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteNotification(notification.id)}
              >
                <IconSymbol name="trash.circle.fill" size={16} color={mutedColor} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="bell.fill" size={48} color={mutedColor} />
      <ThemedText style={[styles.emptyStateTitle, { color: textColor }]}>
        No Notifications
      </ThemedText>
      <ThemedText style={[styles.emptyStateDescription, { color: mutedColor }]}>
        You are all caught up! No notifications to show for the selected filter.
      </ThemedText>
    </View>
  )

  return (
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      <View style={styles.filterScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedFilter === filter ? primaryColor : cardBackground,
                  borderColor,
                },
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  {
                    color: selectedFilter === filter ? '#ffffff' : textColor,
                  },
                ]}
              >
                {filter}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {filteredNotifications.map(renderNotificationCard)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterScrollContainer: {
    flexGrow: 0,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notificationsList: {
    gap: 12,
    paddingBottom: 20,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  notificationType: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
  },
  priorityAndActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
})
