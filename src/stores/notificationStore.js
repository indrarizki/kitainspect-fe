import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardService } from '@/services'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount   = ref(0)
  const notifications = ref([])
  let   _pollInterval = null

  async function fetchUnread() {
    try {
      const { data } = await dashboardService.summary()
      unreadCount.value = data.unread_notifications ?? 0
    } catch { /* silent fail */ }
  }

  async function fetchAll(params = {}) {
    const { data } = await dashboardService.notifications(params)
    notifications.value = data.data ?? []
    return data
  }

  async function markRead(id) {
    await dashboardService.markRead(id)
    const n = notifications.value.find(n => n.id === id)
    if (n) { n.is_read = true; unreadCount.value = Math.max(0, unreadCount.value - 1) }
  }

  async function markAllRead() {
    await dashboardService.markAllRead()
    notifications.value.forEach(n => n.is_read = true)
    unreadCount.value = 0
  }

  function startPolling(intervalMs = 30_000) {
    fetchUnread()
    _pollInterval = setInterval(fetchUnread, intervalMs)
  }

  function stopPolling() {
    if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null }
  }

  return {
    unreadCount, notifications,
    fetchUnread, fetchAll, markRead, markAllRead,
    startPolling, stopPolling,
  }
})