<template>
  <div>
    <!-- Stat cards -->
    <div class="stat-grid">
      <div v-for="s in stats" :key="s.key" class="stat-card">
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-num" :style="`color:${s.color}`">
          <span v-if="loading">—</span>
          <span v-else>{{ summary[s.key] ?? 0 }}</span>
        </div>
        <div class="stat-sub">{{ s.sub }}</div>
      </div>
    </div>

    <div class="row-2">
      <!-- Recent inspections -->
      <div class="card">
        <div class="card-head">
          <span class="card-title">Inspeksi Terbaru</span>
          <RouterLink to="/inspections" class="card-link">Lihat semua</RouterLink>
        </div>
        <div v-if="loadingRecent" class="loading-ph">Memuat...</div>
        <div v-else-if="!recent.length" class="empty-ph">Belum ada inspeksi.</div>
        <div v-else>
          <div v-for="insp in recent" :key="insp.id" class="insp-row" @click="router.push(`/inspections/${insp.id}`)">
            <div class="insp-avatar" :style="`background:${avatarBg(insp.status)};color:${avatarColor(insp.status)}`">
              {{ initials(insp.assigned_to?.name) }}
            </div>
            <div class="insp-info">
              <div class="insp-title">{{ insp.title }}</div>
              <div class="insp-meta">{{ insp.assigned_to?.name }} · {{ formatDate(insp.created_at) }}</div>
            </div>
            <span class="badge" :class="statusClass(insp.status)">{{ statusLabel(insp.status) }}</span>
          </div>
        </div>
      </div>

      <!-- Breakdown donut -->
      <div class="card">
        <div class="card-head"><span class="card-title">Status Breakdown</span></div>
        <div v-if="loading" class="loading-ph">Memuat...</div>
        <div v-else class="breakdown-list">
          <div v-for="b in breakdown" :key="b.key" class="b-row">
            <div class="b-left">
              <div class="b-dot" :style="`background:${b.color}`" />
              <span>{{ b.label }}</span>
            </div>
            <div class="b-right">
              <div class="b-bar-wrap">
                <div class="b-bar" :style="`width:${barPct(b.count)}%;background:${b.color}`" />
              </div>
              <span class="b-val">{{ b.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending approvals banner -->
    <div v-if="summary.pending_approvals > 0 && can('approval.view')" class="approval-banner">
      <span>🕐 Ada <strong>{{ summary.pending_approvals }}</strong> inspeksi menunggu approval Anda</span>
      <RouterLink to="/approvals" class="btn btn-primary btn-sm">Lihat sekarang</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardService } from '@/services'
import { usePermission } from '@/composables'
import { statusLabel, statusClass } from '@/utils/statusHelper'

const router     = useRouter()
const { can }    = usePermission()
const loading        = ref(true)
const loadingRecent  = ref(true)
const summary        = ref({})
const recent         = ref([])

const stats = [
  { key: 'total',     label: 'Total Inspeksi',    color: '#1a1a18', sub: 'Semua status' },
  { key: 'submitted', label: 'Menunggu Review',   color: '#185FA5', sub: 'Submitted' },
  { key: 'approved',  label: 'Disetujui',         color: '#0F6E56', sub: 'Approved' },
  { key: 'rejected',  label: 'Ditolak',           color: '#A32D2D', sub: 'Rejected' },
]

const breakdownDef = [
  { key: 'draft',     label: 'Draft',     color: '#888780' },
  { key: 'submitted', label: 'Submitted', color: '#185FA5' },
  { key: 'in_review', label: 'In Review', color: '#534AB7' },
  { key: 'approved',  label: 'Approved',  color: '#0F6E56' },
  { key: 'rejected',  label: 'Rejected',  color: '#E24B4A' },
]

const breakdown = computed(() =>
  breakdownDef.map(b => ({ ...b, count: summary.value[b.key] ?? 0 }))
)

const maxCount = computed(() => Math.max(...breakdown.value.map(b => b.count), 1))
const barPct   = (count) => Math.round((count / maxCount.value) * 100)

function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}
function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'
}

const bgMap    = { draft:'#F1EFE8', submitted:'#E6F1FB', in_review:'#EEEDFE', approved:'#E1F5EE', rejected:'#FCEBEB' }
const colorMap = { draft:'#5F5E5A', submitted:'#0C447C', in_review:'#3C3489', approved:'#085041', rejected:'#791F1F' }
const avatarBg    = (s) => bgMap[s]    ?? '#F1EFE8'
const avatarColor = (s) => colorMap[s] ?? '#5F5E5A'

onMounted(async () => {
  const [sumRes, recRes] = await Promise.allSettled([
    dashboardService.summary(),
    dashboardService.recent(),
  ])
  if (sumRes.status === 'fulfilled') summary.value = sumRes.value.data.summary ?? sumRes.value.data
  if (recRes.status === 'fulfilled') recent.value  = recRes.value.data.inspections ?? []
  loading.value       = false
  loadingRecent.value = false
})
</script>

<style scoped>
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
.stat-card { background: #fff; border: 0.5px solid #e0dfd8; border-radius: 10px; padding: 14px 16px; }
.stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
.stat-num { font-size: 26px; font-weight: 500; margin-bottom: 3px; }
.stat-sub { font-size: 11.5px; color: #aaa; }
.row-2 { display: grid; grid-template-columns: 1fr 280px; gap: 14px; margin-bottom: 16px; }
.loading-ph, .empty-ph { font-size: 13px; color: #aaa; padding: 20px 0; text-align: center; }
.insp-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 0.5px solid #f0efe8; cursor: pointer; transition: background .1s; }
.insp-row:last-child { border-bottom: none; }
.insp-row:hover { background: #faf9f7; margin: 0 -16px; padding: 9px 16px; }
.insp-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.insp-info { flex: 1; min-width: 0; }
.insp-title { font-size: 13px; color: #1a1a18; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.insp-meta { font-size: 11.5px; color: #aaa; margin-top: 1px; }
.breakdown-list { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.b-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.b-left { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: #555; min-width: 80px; }
.b-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.b-right { display: flex; align-items: center; gap: 8px; flex: 1; }
.b-bar-wrap { flex: 1; height: 6px; background: #f0efe8; border-radius: 3px; overflow: hidden; }
.b-bar { height: 100%; border-radius: 3px; transition: width .4s ease; }
.b-val { font-size: 12px; font-weight: 500; color: #1a1a18; min-width: 24px; text-align: right; }
.card-link { font-size: 12px; color: #534AB7; }
.card-link:hover { text-decoration: underline; }
.approval-banner { display: flex; align-items: center; justify-content: space-between; background: #EEEDFE; border: 1px solid #C9C6F5; border-radius: 10px; padding: 12px 18px; font-size: 13px; color: #3C3489; }
</style>