<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div>
        <h1 style="font-size:16px;font-weight:500">Payroll Periods</h1>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Daftar periode payroll per bulan & tahun</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <select v-model="filters.month">
          <option value="">All months</option>
          <option v-for="(m,i) in months" :key="i" :value="i+1">{{ m }}</option>
        </select>
        <select v-model.number="filters.year">
          <option value="">All years</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
        <button class="btn btn-secondary" @click="fetchPeriods">Filter</button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-ph">Memuat...</div>
      <div v-else>
        <div v-if="!periods.length" class="empty-ph">Tidak ada periode payroll.</div>
        <div class="period-grid">
          <div v-for="p in periods" :key="p.id" class="period-card" @click="openPeriod(p)">
            <div class="period-month">{{ months[p.month-1] }}</div>
            <div class="period-year">{{ p.year }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/services/http'

const router = useRouter()
const loading = ref(false)
const periods = ref([])
const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 6 }).map((_,i) => currentYear - i)

const filters = ref({ month: '', year: '' })

async function fetchPeriods() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.month) params.month = filters.value.month
    if (filters.value.year) params.year = filters.value.year
    const res = await http.get('/payrolls', { params })
    periods.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.error('Failed to load periods', e)
    periods.value = []
  } finally { loading.value = false }
}

function openPeriod(p) {
  router.push({ path: '/payrolls/list', query: { id: p.id, month: p.month, year: p.year } })
}

onMounted(() => fetchPeriods())
</script>

<style scoped>
.period-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px }
.period-card { padding:18px;border:1px solid var(--color-border-tertiary);border-radius:8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .12s }
.period-card:hover { border-color:#534AB7;background:#faf9ff }
.period-month { font-size:14px;font-weight:600 }
.period-year { font-size:12px;color:var(--color-text-tertiary) }
.loading-ph,.empty-ph { text-align:center;padding:24px;color:var(--color-text-tertiary) }
</style>
