<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div>
        <h1 style="font-size:16px;font-weight:500">Edit Attendance</h1>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Perbarui data kehadiran</p>
      </div>
      <div>
        <button class="btn" @click="$router.back()">Batal</button>
        <button class="btn btn-primary" :disabled="saving" @click="submit">Simpan</button>
      </div>
    </div>

    <div v-if="loading" class="loading-ph">Memuat...</div>
    <div v-else>
      <div style="background:#fff;padding:16px;border-radius:8px;max-width:640px">
        <label>Tanggal</label>
        <input v-model="form.date" type="datetime-local" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px" />

        <label style="margin-top:10px;display:block">Check In</label>
        <input v-model="form.checkIn" type="time" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px" />

        <label style="margin-top:10px;display:block">Check Out</label>
        <input v-model="form.checkOut" type="time" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px" />

        <label style="margin-top:10px;display:block">Status</label>
        <select v-model="form.status" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px">
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>

        <label style="margin-top:10px;display:block">Notes</label>
        <textarea v-model="form.notes" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { attendanceService } from '@/services'
import { useToast } from '@/composables'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const toast = useToast()

const form = ref({ date: '', checkIn: '', checkOut: '', status: 'present', notes: '' })
const loading = ref(false)
const saving = ref(false)

const fetch = async () => {
  loading.value = true
  try {
    const res = await attendanceService.get(id)
    const d = res.data
    form.value.date = d.date || ''
    form.value.checkIn = d.checkIn || ''
    form.value.checkOut = d.checkOut || ''
    form.value.status = d.status || 'present'
    form.value.notes = d.notes || ''
  } catch (e) {
    console.error('Gagal memuat attendance', e)
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  saving.value = true
  try {
    await attendanceService.update(id, { date: form.value.date, checkIn: form.value.checkIn, checkOut: form.value.checkOut, status: form.value.status, notes: form.value.notes })
    toast.success('Attendance berhasil diperbarui')
    router.push(`/attendances/${id}`)
  } catch (e) {
    console.error('Gagal menyimpan', e)
    toast.error('Gagal menyimpan perubahan')
  } finally {
    saving.value = false
  }
}

onMounted(fetch)
</script>

<style scoped>
.loading-ph { text-align:center;padding:40px;color:var(--color-text-tertiary);font-size:13px }
</style>
