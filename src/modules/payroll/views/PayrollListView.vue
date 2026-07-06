<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div>
        <h1 style="font-size:16px;font-weight:500">Payroll — {{ periodLabel }}</h1>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Daftar seluruh karyawan pada periode yang dipilih</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn" @click="goBack">Pilih Periode</button>
        <span>&nbsp;</span>
        <button class="btn btn-secondary" @click="openUploadModal()">Import payroll</button>
      </div>
    </div>
    <div class="search-input"
      style="
        display:flex;
        gap:12px;
        align-items:center;
        margin-bottom:16px;
        flex-wrap:wrap;
      "
    >
      <input
        v-model="search"
        type="text"
        placeholder="Cari nama atau NIK..."
        class="filter-input"
      />

      <select v-model="selectedDepartment" class="filter-select">
        <option value="">Semua Departemen</option>
        <option
          v-for="dept in departments"
          :key="dept"
          :value="dept"
        >
          {{ dept }}
        </option>
      </select>

      <div style="font-size:13px;color:var(--color-text-tertiary)">
        {{ filteredPayrolls.length }} data
      </div>
    </div>
    <div class="card">
      <div v-if="loading" class="loading-ph">Memuat...</div>
      <div v-else>
        <div v-if="!filteredPayrolls.length" class="empty-ph">Belum ada data karyawan untuk periode ini.</div>

          <table v-else class="list-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nama</th>
                <th>NIK</th>
                <th>Departemen</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(e, i) in paginatedPayrolls" :key="e.payroll_id">
                  <td>{{ pageStart + i + 1 }}</td>
                  <td>{{ e.employee_name }}</td>
                  <td>{{ e.employee_code }}</td>
                  <td>{{ e.department }}</td>
                  <td>
                      <button
                          class="btn btn-secondary btn-sm"
                          @click="$router.push(`/payrolls/detail/${e.payroll_id}`)"
                      >
                          Show Details
                      </button>
                  </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredPayrolls.length" class="pagination">
            <button class="pg-btn" :disabled="page === 1" @click="page--">Prev</button>
            <span class="page-info">Halaman {{ page }} / {{ totalPages }}</span>
            <button class="pg-btn" :disabled="page === totalPages" @click="page++">Next</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showUploadModal" class="modal-overlay">
        <div class="modal">
            <div class="modal-title">Upload Payroll</div>
            <div style="margin-top:12px">
                <p style="font-size:13px;color:var(--color-text-tertiary);margin-bottom:6px">Pilih file Excel berisi data payroll.</p>
                <input type="file" ref="fileInput" @change="onFileChange" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" />
            </div>
            <div class="modal-footer">
                <button class="btn" @click="closeUploadModal">Batal</button>
                <button class="btn btn-primary" :disabled="uploading" @click="submitUpload">
                    <span v-if="uploading" class="spinner-sm"></span>
                    <span v-if="!uploading">Upload</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { payrollService } from '@/services'
import http from '@/services/http'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const payrolls = ref([])

const search = ref('')
const selectedDepartment = ref('')
const page = ref(1)
const pageSize = 50

const months = ['January','February','March','April','May','June','July','August','September','October','November','December']

const month = ref(route.query.month || '')
const year = ref(route.query.year || '')
const id = ref(route.query.id || '')

const showUploadModal = ref(false)
const uploading = ref(false)

const fileInput = ref(null)
const selectedFile = ref(null)

const periodLabel = computed(() => {
  if (!month.value && !year.value) return 'Semua Periode'
  const m = month.value ? months[Number(month.value) - 1] : ''
  return `${m} ${year.value || ''}`.trim()
})

function goBack() {
  router.push({ path: '/payrolls' })
}

async function load() {
  if (!id.value) {
    payrolls.value = []
    return
  }

  loading.value = true

  try {
    const res = await payrollService.listPayroll(id.value)

    const data = res.data ?? []
    payrolls.value = data.map(item => ({
      payroll_id: item.id,
      employee_id: item.employee?.id,
      employee_code: item.employee?.code,
      employee_name: item.employee?.fullName,
      department: item.employee?.department?.name,
      take_home_pay: item.takeHomePay,
    }))


  } catch (error) {
    console.error(error)
    payrolls.value = []
  } finally {
    loading.value = false
  }
}

const departments = computed(() => {
  const deps = payrolls.value
    .map(p => p.department)
    .filter(Boolean)

  return [...new Set(deps)].sort()
})

const filteredPayrolls = computed(() => {
  return payrolls.value.filter(item => {

    const matchDepartment =
      !selectedDepartment.value ||
      item.department === selectedDepartment.value

    const keyword = search.value.toLowerCase()

    const matchSearch =
      !keyword ||
      item.employee_name?.toLowerCase().includes(keyword) ||
      item.employee_code?.toLowerCase().includes(keyword)

    return matchDepartment && matchSearch
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredPayrolls.value.length / pageSize))
})

const pageStart = computed(() => {
  return (page.value - 1) * pageSize
})

const paginatedPayrolls = computed(() => {
  return filteredPayrolls.value.slice(pageStart.value, pageStart.value + pageSize)
})

watch([search, selectedDepartment], () => {
  page.value = 1
})

watch(totalPages, (value) => {
  if (page.value > value) page.value = value
})

watch(() => route.query, (q) => {
  month.value = q.month || ''
  year.value = q.year || ''
  id.value = q.id || ''
  page.value = 1
  load()
}, { immediate: true })

function openUploadModal() { showUploadModal.value = true }
function closeUploadModal() { showUploadModal.value = false; selectedFile.value = null; if (fileInput.value) fileInput.value.value = null }

function onFileChange(e) {
    const f = e.target.files && e.target.files[0]
    selectedFile.value = f || null
}

async function submitUpload() {
    if (!selectedFile.value) return alert('Pilih file terlebih dahulu')
    uploading.value = true
    try {
        const fd = new FormData()
        fd.append('file', selectedFile.value)
        
        await http.post('/payrolls/import/' + route.query.id, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        alert('Upload berhasil')
        closeUploadModal()
        load()
    } catch (e) {
        console.error(e)
        alert('Gagal meng-upload file')
    } finally {
        uploading.value = false
    }
}
</script>

<style scoped>
.search-wrap input { padding:7px 12px;border:1px solid var(--color-border-tertiary);border-radius:7px;font-size:13px;outline:none;width:220px }
.company-avatar { width:34px;height:34px;border-radius:8px;background:#534AB7;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.loading-ph,.empty-ph { text-align:center;padding:40px;color:var(--color-text-tertiary);font-size:13px }
.pg-btn { min-width:64px;height:30px;padding:0 10px;border:1px solid var(--color-border-tertiary);border-radius:6px;background:#fff;font-size:13px;cursor:pointer }
.pg-btn.active { background:#534AB7;color:#fff;border-color:#534AB7 }
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100 }
.modal { background:#fff;border-radius:12px;padding:24px;width:440px;max-width:92%;box-shadow:0 8px 32px rgba(0,0,0,.15) }
.modal-title { font-size:15px;font-weight:500 }
.modal-footer { display:flex;gap:8px;justify-content:flex-end;margin-top:16px }
.spinner-sm { width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block }
.search-input { display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap }
.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--color-border-tertiary);
  border-radius: 8px;
  font-size: 13px;
  min-width: 220px;
  outline: none;
}

.filter-select {
  min-width: 200px;
}
.pagination {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  padding-top: 12px;
}
.page-info {
  font-size: 13px;
  color: var(--color-text-tertiary);
}
.pg-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}
@keyframes spin { to { transform:rotate(360deg) } }
</style>
