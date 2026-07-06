import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services'

export const useAuthStore = defineStore('auth', () => {
  const user        = ref(null)
  const token       = ref(localStorage.getItem('kita_token') ?? null)
  const permissions = ref([])
  const loading     = ref(false)

  // ── Computed ───────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value)
  const roleSlug        = computed(() => user.value?.role?.slug ?? null)
  const isSuperAdmin    = computed(() => roleSlug.value === 'super_admin')
  const isAdmin         = computed(() => ['super_admin', 'admin'].includes(roleSlug.value))
  const isInspector     = computed(() => roleSlug.value === 'inspector')
  const isReviewer      = computed(() => roleSlug.value === 'reviewer')
  const isViewer        = computed(() => roleSlug.value === 'viewer')

  // ── Actions ────────────────────────────────────────────────────────────────
  async function login(email, password) {
    loading.value = true
    try {
      const { data } = await authService.login({ email, password })
      _setSession(data.token, data.user)
      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        errors:  err.response?.data?.errors  ?? {},
        message: err.response?.data?.message ?? 'Login gagal.',
      }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try { await authService.logout() } finally { clearSession() }
  }

  async function fetchMe() {
    try {
      const { data } = await authService.me()
      _hydrateUser(data.user)
    } catch {
      clearSession()
    }
  }

  function clearSession() {
    token.value       = null
    user.value        = null
    permissions.value = []
    localStorage.removeItem('kita_token')
  }

  // ── Permission helper ──────────────────────────────────────────────────────
  function can(slug) {
    if (isSuperAdmin.value) return true
    return permissions.value.includes(slug)
  }

  // ── Private ────────────────────────────────────────────────────────────────
  function _setSession(rawToken, rawUser) {
    token.value = rawToken
    localStorage.setItem('kita_token', rawToken)
    _hydrateUser(rawUser)
  }

  function _hydrateUser(rawUser) {
    user.value        = rawUser
    permissions.value = rawUser?.permissions ?? []
  }

  return {
    user, token, permissions, loading,
    isAuthenticated, roleSlug,
    isSuperAdmin, isAdmin, isInspector, isReviewer, isViewer,
    login, logout, fetchMe, clearSession, can,
  }
})