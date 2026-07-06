<template>
  <div class="shell">
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sb-logo">
        <div class="sb-logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
        </div>
        <span v-if="!sidebarCollapsed" class="sb-logo-text">kita<span>INSPECT</span></span>
      </div>

      <nav class="sb-nav">
        <div class="sb-section" v-if="!sidebarCollapsed">Menu</div>

        <RouterLink v-if="can('dashboard.view')" to="/dashboard" class="sb-item" active-class="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span v-if="!sidebarCollapsed">Dashboard</span>
        </RouterLink>

        <div v-if="can('inspection.view-all') || can('inspection.view-own')" class="sb-group">
          <div 
            class="sb-item sb-trigger" 
            :class="{ 'active': isInspectionRouteActive, 'is-open': isInspectionOpen }"
            @click="toggleInspectionMenu"
          >
            <div class="sb-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="sb-icon">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <span v-if="!sidebarCollapsed">Inspeksi</span>
            </div>
            
            <svg 
              v-if="!sidebarCollapsed" 
              class="sb-arrow" 
              :class="{ 'rotate': isInspectionOpen }" 
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <transition name="expand">
            <div v-show="isInspectionOpen && !sidebarCollapsed" class="sb-submenu">
              <RouterLink to="/inspections" class="sb-subitem" active-class="sub-active" exact-active-class="sub-active-exact">
                <span class="subitem-dot"></span>
                List Inspeksi
              </RouterLink>

              <RouterLink to="/inspections/calendar" class="sb-subitem" active-class="sub-active">
                <span class="subitem-dot"></span>
                Kalender Inspeksi
              </RouterLink>
            </div>
          </transition>
        </div>
        
        <RouterLink v-if="can('approval.view')" to="/approvals" class="sb-item" active-class="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span v-if="!sidebarCollapsed">Approval</span>
          <span v-if="!sidebarCollapsed && unreadCount > 0" class="sb-badge">{{ unreadCount }}</span>
        </RouterLink>
        
        <RouterLink v-if="can('template.view')" to="/templates" class="sb-item" active-class="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span v-if="!sidebarCollapsed">Template & Checkpoint</span>
        </RouterLink>

        <div class="sb-section" v-if="can('dashboard.hris.view') && !sidebarCollapsed">HRIS</div>

        <RouterLink v-if="can('dashboard.hris.view')" to="/dashboard-hris" class="sb-item" active-class="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span v-if="!sidebarCollapsed">Dashboard HRIS</span>
        </RouterLink>

        <div v-if="can('dashboard.hris.view') && !sidebarCollapsed" class="sb-group">
          <div 
            class="sb-item sb-trigger" 
            :class="{ 'active': isHrdRouteActive, 'is-open': isHrdOpen }"
            @click="toggleHrdMenu"
          >
            <div class="sb-item-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="sb-icon">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <span v-if="!sidebarCollapsed">HRD</span>
            </div>
            
            <svg 
              v-if="!sidebarCollapsed" 
              class="sb-arrow" 
              :class="{ 'rotate': isHrdOpen }" 
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <transition name="expand">
            <div v-show="isHrdOpen && !sidebarCollapsed" class="sb-submenu">
              <RouterLink v-if="can('employee.view')" to="/employees" class="sb-subitem" active-class="sub-active" exact-active-class="sub-active-exact">
                <span class="subitem-dot"></span>
                Employee
              </RouterLink>

              <RouterLink v-if="can('dashboard.hris.view')" to="/hris/master-data" class="sb-subitem" active-class="sub-active" exact-active-class="sub-active-exact">
                <span class="subitem-dot"></span>
                Master Data
              </RouterLink>

              <RouterLink v-if="can('dashboard.hris.view')" to="/hris/shift-overtime" class="sb-subitem" active-class="sub-active" exact-active-class="sub-active-exact">
                <span class="subitem-dot"></span>
                Shift & Overtime
              </RouterLink>

              <RouterLink v-if="can('holiday.calender.view')" to="/holiday-calender" class="sb-subitem" active-class="sub-active" exact-active-class="sub-active-exact">
                <span class="subitem-dot"></span>
                Calender
              </RouterLink>

              <RouterLink v-if="can('attendance.view')" to="/attendances" class="sb-subitem" active-class="sub-active" exact-active-class="sub-active-exact">
                <span class="subitem-dot"></span>
                Attendance
              </RouterLink>

              <RouterLink v-if="can('payroll.view')" to="/payrolls" class="sb-subitem" active-class="sub-active" exact-active-class="sub-active-exact">
                <span class="subitem-dot"></span>
                Payroll
              </RouterLink>
            </div>
          </transition>
        </div>

        <div class="sb-section" v-if="!sidebarCollapsed">Admin</div>

        <RouterLink v-if="can('company.view')" to="/companies" class="sb-item" active-class="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h1m0 0h8m-8 0v1a3 3 0 106 0v-1m-6 0h6"/></svg>
          <span v-if="!sidebarCollapsed">Perusahaan</span>
        </RouterLink>

        <RouterLink v-if="can('department.view')" to="/departments" class="sb-item" active-class="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h1m0 0h8m-8 0v1a3 3 0 106 0v-1m-6 0h6"/></svg>
          <span v-if="!sidebarCollapsed">Departemen</span>
        </RouterLink>

        <RouterLink v-if="can('user.view')" to="/users" class="sb-item" active-class="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span v-if="!sidebarCollapsed">Pengguna</span>
        </RouterLink>

        <RouterLink v-if="can('role.view')" to="/roles" class="sb-item" active-class="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span v-if="!sidebarCollapsed">Roles</span>
        </RouterLink>
      </nav>


      <div class="sb-bottom">
        <div class="user-row" v-if="!sidebarCollapsed">
          <div class="avatar">{{ initials }}</div>
          <div class="user-info">
            <div class="user-name">{{ auth.user?.name }}</div>
            <div class="user-role">{{ auth.user?.role?.name }}</div>
          </div>
        </div>
        <button class="sb-item logout-btn" @click="handleLogout" style="width:100%;margin-top:8px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span v-if="!sidebarCollapsed">Logout</span>
        </button>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div class="topbar-title">{{ pageTitle }}</div>
        <div class="topbar-right">
          <span class="topbar-date">{{ dateStr }} {{ timeStr }}</span>
          <RouterLink to="/approvals" class="notif-btn" v-if="can('approval.view')">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            <span v-if="unreadCount > 0" class="notif-dot">{{ unreadCount }}</span>
          </RouterLink>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { usePermission } from '@/composables'

const auth         = useAuthStore()
const notifStore   = useNotificationStore()
const route        = useRoute()
const router       = useRouter()
const { can }      = usePermission()

const sidebarCollapsed = ref(false)
const unreadCount      = computed(() => notifStore.unreadCount)

// --- STATE & METODE DROPDOWN INSPEKSI ---
const isInspectionOpen = ref(false)

const isInspectionRouteActive = computed(() => {
  return route.path.startsWith('/inspections')
})

const isHrdOpen = ref(false)

const isHrdRouteActive = computed(() => {
  return route.path.startsWith('/hris')
    || route.path.startsWith('/employees')
    || route.path.startsWith('/attendances')
    || route.path.startsWith('/payrolls')
    || route.path.startsWith('/holiday')
})

watch(isInspectionRouteActive, (isActive) => {
  if (isActive) isInspectionOpen.value = true
}, { immediate: true })

watch(isHrdRouteActive, (isActive) => {
  if (isActive) isHrdOpen.value = true
}, { immediate: true })

function toggleInspectionMenu() {
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
    isInspectionOpen.value = true
    return
  }
  isInspectionOpen.value = !isInspectionOpen.value
}

function toggleHrdMenu() {
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
    isHrdOpen.value = true
    return
  }
  isHrdOpen.value = !isHrdOpen.value
}

// --- LOGIKA INITIALS & PAGE TITLES ---
const initials = computed(() => {
  const name = auth.user?.name ?? ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
})

const PAGE_TITLES = {
  dashboard:          'Dashboard',
  'dashboard-hris': 'Dashboard HRIS',
  'hris-master-data': 'HRIS Master Data',
  'hris-shift-overtime': 'Shift & Overtime',
  inspections:        'Daftar Inspeksi',
  'inspection-detail': 'Detail Inspeksi',
  'inspection-create': 'Buat Inspeksi',
  approvals:          'Antrian Approval',
  'approval-detail': 'Detail Approval',
  templates:          'Form Template',
  'template-create':   'Buat Template', 
  'template-builder':'Template Builder',
  users:             'Manajemen Pengguna',
  companies:           'Manajemen Perusahaan',
  reports:             'Laporan Inspeksi',
  roles:               'Manajemen Role',
}

const pageTitle = computed(() => PAGE_TITLES[route.name] ?? 'kitaINSPECT')

const dateStr = computed(() =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

// --- PERBAIKAN REAKTIVITAS JAM DIGITAL ---
const currentTime = ref(new Date())
let timerID = null

const timeStr = computed(() => {
  const cd = currentTime.value
  return zeroPadding(cd.getHours(), 2) + ':' + zeroPadding(cd.getMinutes(), 2) + ':' + zeroPadding(cd.getSeconds(), 2)
})

function zeroPadding(num, digit) {
  let zero = ''
  for (let i = 0; i < digit; i++) { zero += '0' }
  return (zero + num).slice(-digit)
}

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}

onMounted(() => {
  notifStore.startPolling()
  // Interval yang benar untuk memperbarui objek Date secara reaktif
  timerID = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  notifStore.stopPolling()
  if (timerID) clearInterval(timerID)
})
</script>

<style scoped>
/* CSS bawaan Anda tetap dipertahankan sepenuhnya */
.shell { display: flex; min-height: 100vh; }
.sidebar { width: 220px; background: #fff; border-right: 0.5px solid #e0dfd8; display: flex; flex-direction: column; transition: width .2s; flex-shrink: 0; }
.sidebar.collapsed { width: 58px; }
.sb-logo { display: flex; align-items: center; gap: 9px; padding: 18px 14px 14px; border-bottom: 0.5px solid #e0dfd8; }
.sb-logo-icon { width: 30px; height: 30px; background: #534AB7; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sb-logo-text { font-size: 14px; font-weight: 500; color: #1a1a18; white-space: nowrap; }
.sb-logo-text span { color: #534AB7; }
.sb-nav { flex: 1; padding: 8px 0; }
.sb-section { padding: 10px 16px 4px; font-size: 10px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
.sb-item { display: flex; align-items: center; gap: 9px; padding: 8px 12px; border-radius: 7px; margin: 1px 8px; color: #666; font-size: 13px; transition: background .12s, color .12s; border: none; background: none; text-decoration: none; }
.sb-item:hover { background: #f5f4f0; color: #1a1a18; }
.sb-item.active { background: #EEEDFE; color: #534AB7; font-weight: 500; }
.sb-item svg { width: 16px; height: 16px; flex-shrink: 0; }
.sb-badge { margin-left: auto; background: #F5C4B3; color: #712B13; font-size: 10.5px; font-weight: 600; padding: 1px 6px; border-radius: 10px; }
.sb-bottom { padding: 12px; border-top: 0.5px solid #e0dfd8; }
.user-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: #EEEDFE; color: #534AB7; font-size: 11.5px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.user-info { min-width: 0; }
.user-name { font-size: 12.5px; font-weight: 500; color: #1a1a18; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 11px; color: #aaa; }
.logout-btn { color: #A32D2D !important; }
.logout-btn:hover { background: #FCEBEB !important; }

.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.topbar { display: flex; align-items: center; padding: 12px 24px; background: #fff; border-bottom: 0.5px solid #e0dfd8; gap: 12px; position: sticky; top: 0; z-index: 10; }
.toggle-btn { width: 32px; height: 32px; border: 0.5px solid #e0dfd8; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: none; color: #666; flex-shrink: 0; }
.toggle-btn:hover { background: #f5f4f0; }
.topbar-title { font-size: 15px; font-weight: 500; color: #1a1a18; flex: 1; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.topbar-date { font-size: 12px; color: #aaa; }
.notif-btn { position: relative; width: 34px; height: 34px; border: 0.5px solid #e0dfd8; border-radius: 7px; display: flex; align-items: center; justify-content: center; color: #666; }
.notif-btn:hover { background: #f5f4f0; }
.notif-dot { position: absolute; top: 5px; right: 5px; min-width: 16px; height: 16px; background: #E24B4A; color: #fff; border-radius: 8px; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 3px; border: 2px solid #fff; }
.content { flex: 1; padding: 22px 24px; overflow: auto; }

/* --- CSS BARU KHUSUS SUBMENU DROPDOWN --- */
.sb-group { display: flex; flex-direction: column; }
.sb-trigger { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.sb-item-left { display: flex; align-items: center; gap: 9px; }
.sb-arrow { width: 12px; height: 12px; color: #666; transition: transform 0.2s ease, color 0.12s; }
.sb-trigger:hover .sb-arrow, .sb-trigger.active .sb-arrow { color: inherit; }
.sb-arrow.rotate { transform: rotate(180deg); }
.sb-submenu { display: flex; flex-direction: column; padding-left: 24px; margin: 2px 8px; gap: 2px; overflow: hidden; }
.sb-subitem { display: flex; align-items: center; gap: 8px; padding: 7px 12px; font-size: 12.5px; color: #666; text-decoration: none; border-radius: 6px; transition: background .12s, color .12s; }
.sb-subitem:hover { background: #f5f4f0; color: #1a1a18; }
.subitem-dot { width: 4px; height: 4px; background-color: #ccc; border-radius: 50%; transition: background-color 0.12s, transform 0.12s; }
.sb-subitem:hover .subitem-dot { background-color: #1a1a18; transform: scale(1.2); }
.sb-subitem.sub-active { color: #534AB7; font-weight: 500; }
.sb-subitem.sub-active .subitem-dot { background-color: #534AB7; }

/* Efek Slide Animasi */
.expand-enter-active, .expand-leave-active { transition: max-height 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease; max-height: 120px; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }
</style>
