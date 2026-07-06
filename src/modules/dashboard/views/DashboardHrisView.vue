<template>
    <div class="dashboard-hris">
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
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { usePermission } from '@/composables'
import { useRouter } from 'vue-router'
import { dashboardHrisService } from '@/services'

const router = useRouter()
const auth = useAuthStore()
const { can } = usePermission()
const loading = ref(true)
const summary = ref({})

const stats = [
    { key: 'total_employees', label: 'Total Karyawan', color: '#3C3489', sub: 'Semua karyawan terdaftar' },
    { key: 'active_employees', label: 'Karyawan Aktif', color: '#085041', sub: 'Karyawan dengan status aktif' },
    { key: 'departments', label: 'Departemen', color: '#0C447C', sub: 'Jumlah departemen' },
    { key: 'positions', label: 'Posisi', color: '#791F1F', sub: 'Jumlah posisi/jabatan' },
]

onMounted(async () => {
    const [sumRes] = await Promise.allSettled([
        dashboardHrisService.summary(),
        ])
    if (sumRes.status === 'fulfilled') summary.value = sumRes.value.data.summary ?? sumRes.value.data
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
