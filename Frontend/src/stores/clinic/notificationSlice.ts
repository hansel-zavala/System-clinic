import type { Ref } from 'vue'
import type { NotificationItem, UserProfile } from '../../domain/types'
import { persistClinicTables } from '../../data/repositories/clinicRepository'

export function createNotificationActions(
  notifications: Ref<NotificationItem[]>,
  currentUser: Ref<UserProfile>,
) {
  const pushNotification = async (notification: NotificationItem) => {
    if (!notification.userId?.trim()) {
      if (import.meta.env.DEV) {
        console.warn('[notifications] Se ignoró un aviso sin userId destinatario.')
      }
      return
    }
    notifications.value.unshift(notification)
    await persistClinicTables({ notifications: notifications.value })
  }

  const markNotificationRead = async (notificationId: string) => {
    const target = notifications.value.find(
      (item) => item.id === notificationId && item.userId === currentUser.value.id,
    )
    if (!target) return
    target.leida = true
    await persistClinicTables({ notifications: notifications.value })
  }

  return { pushNotification, markNotificationRead }
}
