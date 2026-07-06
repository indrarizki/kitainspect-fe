import { useAuthStore } from '@/modules/auth/store/authStore'
import { storeToRefs }   from 'pinia'

// ── usePermission ─────────────────────────────────────────────────────────────
export function usePermission() {
  const auth = useAuthStore()
  const { roleSlug, isSuperAdmin, isAdmin, isInspector, isReviewer, isViewer } = storeToRefs(auth)
  return { can: auth.can, role: roleSlug, isSuperAdmin, isAdmin, isInspector, isReviewer, isViewer }
}

// ── useToast — simple reactive toast ─────────────────────────────────────────
import { ref } from 'vue'
const _toasts = ref([])
let _tid = 0

export function useToast() {
  function show(message, type = 'success', duration = 3500) {
    const id = ++_tid
    _toasts.value.push({ id, message, type })
    setTimeout(() => { _toasts.value = _toasts.value.filter(t => t.id !== id) }, duration)
  }
  return {
    toasts:  _toasts,
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    info:    (msg) => show(msg, 'info'),
    warning: (msg) => show(msg, 'warning'),
  }
}

// ── useDownload — blob file download helper ───────────────────────────────────
export function useDownload() {
  function download(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href    = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }
  return { download }
}


