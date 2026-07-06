<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div>
        <h1 style="font-size:16px;font-weight:500">Detail Attendance</h1>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Rincian kehadiran</p>
      </div>
      <div>
        <button class="btn btn-secondary" @click="$router.back()">Kembali</button>
        <button v-if="can('attendance.update')" class="btn btn-primary" @click="$router.push(`/attendances/${id}/edit`)">Edit</button>
      </div>
    </div>

    <div v-if="loading" class="loading-ph">Memuat...</div>
    <div v-else>
      <div style="background:#fff;padding:16px;border-radius:8px">
        <p><strong>Tanggal:</strong> {{ formatDate(item.date) }}</p>
        <p><strong>Employee:</strong> {{ item.employeeName || item.employee?.fullName || '-' }}</p>
        <p><strong>Check In:</strong> {{ item.checkIn || '-' }}</p>
        <p><strong>Check Out:</strong> {{ item.checkOut || '-' }}</p>
        <p><strong>Status:</strong> {{ item.status || '-' }}</p>
        <p v-if="item.notes"><strong>Notes:</strong> {{ item.notes }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { attendanceService } from '@/services'
import { usePermission } from '@/composables'

const route = useRoute()
const id = route.params.id
const { can } = usePermission()

const item = ref({})
const loading = ref(false)

const fetch = async () => {
  loading.value = true
  try {
    const res = await attendanceService.get(id)
    item.value = res.data
  } catch (e) {
    console.error('Gagal memuat detail attendance', e)
  } finally {
    loading.value = false
  }
}

function formatDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleString() } catch { return d }
}

onMounted(fetch)
</script>

<style scoped>
.loading-ph { text-align:center;padding:40px;color:var(--color-text-tertiary);font-size:13px }
</style>
