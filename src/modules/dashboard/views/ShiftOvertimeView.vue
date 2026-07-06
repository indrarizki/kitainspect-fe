<template>
  <div class="shift-page">
    <div class="page-head">
      <div>
        <h1>Shift & Overtime</h1>
        <p>Kelola shift default, jadwal kerja karyawan, dan overtime</p>
      </div>
      <button class="btn btn-primary" @click="openForm()">Tambah {{ activeConfig.label }}</button>
    </div>

    <div class="tabs">
      <button
        v-for="item in tabs"
        :key="item.key"
        class="tab-btn"
        :class="{ active: activeTab === item.key }"
        @click="setTab(item.key)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="toolbar">
      <input
        v-if="activeTab === 'shiftments'"
        v-model="filters.search"
        class="filter-input"
        placeholder="Cari kode atau nama shift..."
        @keyup.enter="fetchActiveItems"
      />

      <select v-if="activeTab !== 'shiftments'" v-model="filters.employee_id" class="filter-input">
        <option value="">Semua karyawan</option>
        <option v-for="employee in employeeOptions" :key="employee.value" :value="employee.value">
          {{ employee.label }}
        </option>
      </select>

      <select v-if="activeTab !== 'shiftments'" v-model="filters.shiftment_id" class="filter-input">
        <option value="">Semua shift</option>
        <option v-for="shift in shiftOptions" :key="shift.value" :value="shift.value">
          {{ shift.label }}
        </option>
      </select>

      <input v-if="activeTab !== 'shiftments'" v-model="filters.date_from" class="filter-input date-input" type="date" />
      <input v-if="activeTab !== 'shiftments'" v-model="filters.date_to" class="filter-input date-input" type="date" />

      <button class="btn btn-secondary" @click="fetchActiveItems">Filter</button>
      <button v-if="hasFilters" class="btn btn-secondary" @click="resetFilters">Reset</button>
    </div>

    <div class="summary-row">
      <div class="summary-item">
        <span>Total Shift</span>
        <strong>{{ shiftments.length }}</strong>
      </div>
      <div class="summary-item">
        <span>Schedule Aktif</span>
        <strong>{{ workShifts.length }}</strong>
      </div>
      <div class="summary-item">
        <span>Overtime</span>
        <strong>{{ overtimes.length }}</strong>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="loading-ph">Memuat...</div>
      <div v-else-if="!activeItems.length" class="empty-ph">Belum ada data.</div>

      <table v-else class="list-table">
        <thead>
          <tr>
            <th v-for="column in activeConfig.columns" :key="column.key">{{ column.label }}</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in activeItems" :key="item.id">
            <td v-for="column in activeConfig.columns" :key="column.key">
              <span v-if="column.badge" class="badge" :class="{ active: formatValue(item, column) === 'Ya' }">
                {{ formatValue(item, column) }}
              </span>
              <span v-else>{{ formatValue(item, column) }}</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn btn-secondary btn-sm" @click="openForm(item)">Edit</button>
                <button class="btn btn-danger btn-sm" @click="removeItem(item)">Hapus</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-overlay">
      <div class="modal">
        <div class="modal-title">{{ editingItem ? 'Edit' : 'Tambah' }} {{ activeConfig.label }}</div>

        <div class="form-grid">
          <label v-for="field in activeConfig.fields" :key="field.key" class="field" :class="{ full: field.full }">
            <span>{{ field.label }}</span>

            <select v-if="field.type === 'select'" v-model="form[field.key]">
              <option value="">Pilih</option>
              <option v-for="option in fieldOptions(field)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>

            <textarea v-else-if="field.type === 'textarea'" v-model="form[field.key]" rows="3"></textarea>

            <label v-else-if="field.type === 'checkbox'" class="check-row">
              <input v-model="form[field.key]" type="checkbox" />
              <span>{{ field.checkLabel }}</span>
            </label>

            <input
              v-else
              v-model="form[field.key]"
              :type="field.type || 'text'"
              :maxlength="field.maxlength"
              :min="field.min"
              :step="field.step"
            />
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn" @click="closeForm">Batal</button>
          <button class="btn btn-primary" :disabled="saving" @click="submitForm">
            <span v-if="saving" class="spinner-sm"></span>
            <span v-else>Simpan</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  employeeService,
  overtimeService,
  shiftmentService,
  workShiftService,
} from '@/services'

const tabs = [
  {
    key: 'shiftments',
    label: 'Default Shift',
    itemLabel: 'shift',
    service: shiftmentService,
    columns: [
      { key: 'code', label: 'Kode' },
      { key: 'name', label: 'Nama Shift' },
      { key: 'startHour', label: 'Jam Mulai', formatter: 'time' },
      { key: 'endHour', label: 'Jam Selesai', formatter: 'time' },
    ],
    fields: [
      { key: 'code', label: 'Kode', maxlength: 7 },
      { key: 'name', label: 'Nama Shift' },
      { key: 'startHour', label: 'Jam Mulai', type: 'time' },
      { key: 'endHour', label: 'Jam Selesai', type: 'time' },
    ],
  },
  {
    key: 'workshifts',
    label: 'Schedule',
    itemLabel: 'schedule',
    service: workShiftService,
    columns: [
      { key: 'employee', label: 'Karyawan', formatter: 'employee' },
      { key: 'shiftment', label: 'Shift', formatter: 'shiftment' },
      { key: 'startDate', label: 'Mulai', formatter: 'date' },
      { key: 'endDate', label: 'Selesai', formatter: 'date' },
      { key: 'description', label: 'Catatan' },
    ],
    fields: [
      { key: 'employee_id', label: 'Karyawan', type: 'select', options: 'employees', full: true },
      { key: 'shiftment_id', label: 'Shift', type: 'select', options: 'shiftments', full: true },
      { key: 'startDate', label: 'Tanggal Mulai', type: 'date' },
      { key: 'endDate', label: 'Tanggal Selesai', type: 'date' },
      { key: 'description', label: 'Catatan', type: 'textarea', full: true },
    ],
  },
  {
    key: 'overtimes',
    label: 'Overtime',
    itemLabel: 'overtime',
    service: overtimeService,
    columns: [
      { key: 'employee', label: 'Karyawan', formatter: 'employee' },
      { key: 'overtimeDate', label: 'Tanggal', formatter: 'date' },
      { key: 'timeRange', label: 'Jam', formatter: 'timeRange' },
      { key: 'rawValue', label: 'Raw', formatter: 'decimal' },
      { key: 'calculatedValue', label: 'Calculated', formatter: 'decimal' },
      { key: 'holiday', label: 'Holiday', formatter: 'yesNo', badge: true },
      { key: 'overday', label: 'Overday', formatter: 'yesNo', badge: true },
      { key: 'description', label: 'Catatan' },
    ],
    fields: [
      { key: 'employee_id', label: 'Karyawan', type: 'select', options: 'employees', full: true },
      { key: 'shiftment_id', label: 'Shift Referensi', type: 'select', options: 'shiftments', full: true },
      { key: 'approved_by_id', label: 'Disetujui Oleh', type: 'select', options: 'employees', full: true },
      { key: 'overtimeDate', label: 'Tanggal Overtime', type: 'date' },
      { key: 'startHour', label: 'Jam Mulai', type: 'time' },
      { key: 'endHour', label: 'Jam Selesai', type: 'time' },
      { key: 'rawValue', label: 'Raw Value', type: 'number', min: 0, step: '0.25' },
      { key: 'calculatedValue', label: 'Calculated Value', type: 'number', min: 0, step: '0.25' },
      { key: 'holiday', label: 'Holiday', type: 'checkbox', checkLabel: 'Hari libur' },
      { key: 'overday', label: 'Overday', type: 'checkbox', checkLabel: 'Lewat hari' },
      { key: 'description', label: 'Catatan', type: 'textarea', full: true },
    ],
  },
]

const activeTab = ref('shiftments')
const shiftments = ref([])
const workShifts = ref([])
const overtimes = ref([])
const employees = ref([])
const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({})
const filters = ref(defaultFilters())

const activeConfig = computed(() => tabs.find((item) => item.key === activeTab.value) || tabs[0])
const activeItems = computed(() => collectionByTab(activeTab.value).value)

const employeeOptions = computed(() => {
  return employees.value.map((employee) => ({
    value: employee.id,
    label: `${employee.code || '-'} - ${employee.fullName || '-'}`,
  }))
})

const shiftOptions = computed(() => {
  return shiftments.value.map((shift) => ({
    value: shift.id,
    label: `${shift.code || '-'} - ${shift.name || '-'} (${formatTime(shift.startHour)}-${formatTime(shift.endHour)})`,
  }))
})

const hasFilters = computed(() => {
  return Object.values(filters.value).some((value) => Boolean(value))
})

function defaultFilters() {
  return {
    search: '',
    employee_id: '',
    shiftment_id: '',
    date_from: '',
    date_to: '',
  }
}

function collectionByTab(tab) {
  if (tab === 'workshifts') return workShifts
  if (tab === 'overtimes') return overtimes
  return shiftments
}

function setTab(tab) {
  activeTab.value = tab
}

function resetFilters() {
  filters.value = defaultFilters()
  fetchActiveItems()
}

function buildParams() {
  const params = {}

  Object.entries(filters.value).forEach(([key, value]) => {
    if (!value) return
    if (activeTab.value === 'shiftments' && key !== 'search') return
    if (activeTab.value !== 'shiftments' && key === 'search') return
    params[key] = value
  })

  return params
}

async function fetchActiveItems() {
  loading.value = true
  try {
    const response = await activeConfig.value.service.list(buildParams())
    collectionByTab(activeTab.value).value = normalizeListResponse(response)
  } catch (error) {
    console.error(`Failed to load ${activeConfig.value.key}`, error)
    collectionByTab(activeTab.value).value = []
  } finally {
    loading.value = false
  }
}

async function fetchShiftments() {
  try {
    const response = await shiftmentService.list()
    shiftments.value = normalizeListResponse(response)
  } catch (error) {
    console.error('Failed to load shiftments', error)
    shiftments.value = []
  }
}

async function fetchEmployees() {
  try {
    const response = await employeeService.list()
    employees.value = normalizeListResponse(response)
  } catch (error) {
    console.error('Failed to load employees', error)
    employees.value = []
  }
}

function normalizeListResponse(response) {
  const data = response.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

function defaultForm() {
  return activeConfig.value.fields.reduce((payload, field) => {
    payload[field.key] = field.type === 'checkbox' ? false : ''
    return payload
  }, {})
}

function openForm(item = null) {
  editingItem.value = item
  form.value = item ? { ...defaultForm(), ...toFormPayload(item) } : defaultForm()
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingItem.value = null
  form.value = {}
}

function toFormPayload(item) {
  return {
    ...item,
    startHour: normalizeTimeInput(item.startHour),
    endHour: normalizeTimeInput(item.endHour),
    employee_id: item.employee_id ?? item.employee?.id ?? '',
    shiftment_id: item.shiftment_id ?? item.shiftment?.id ?? '',
    approved_by_id: item.approved_by_id ?? item.approved_by?.id ?? '',
  }
}

function normalizePayload() {
  const payload = { ...form.value }

  activeConfig.value.fields.forEach((field) => {
    if (payload[field.key] === '') payload[field.key] = null
    if (field.type === 'checkbox') payload[field.key] = Boolean(payload[field.key])
    if (field.type === 'time' && payload[field.key]) payload[field.key] = normalizeTimeInput(payload[field.key])
    if (field.type === 'number' && payload[field.key] !== null) payload[field.key] = Number(payload[field.key])
  })

  return payload
}

async function submitForm() {
  saving.value = true
  try {
    const payload = normalizePayload()
    if (editingItem.value) {
      await activeConfig.value.service.update(editingItem.value.id, payload)
    } else {
      await activeConfig.value.service.create(payload)
    }

    closeForm()
    if (activeTab.value === 'shiftments') {
      await Promise.all([fetchActiveItems(), fetchScheduleData()])
    } else {
      await fetchActiveItems()
    }
  } catch (error) {
    console.error(`Failed to save ${activeConfig.value.key}`, error)
    alert('Gagal menyimpan data')
  } finally {
    saving.value = false
  }
}

async function removeItem(item) {
  if (!confirm(`Hapus ${activeConfig.value.itemLabel} ini?`)) return

  try {
    await activeConfig.value.service.delete(item.id)
    if (activeTab.value === 'shiftments') {
      await Promise.all([fetchActiveItems(), fetchScheduleData()])
    } else {
      await fetchActiveItems()
    }
  } catch (error) {
    console.error(`Failed to delete ${activeConfig.value.key}`, error)
    alert('Gagal menghapus data')
  }
}

async function fetchScheduleData() {
  const [workShiftResponse, overtimeResponse] = await Promise.all([
    workShiftService.list(),
    overtimeService.list(),
  ])

  workShifts.value = normalizeListResponse(workShiftResponse)
  overtimes.value = normalizeListResponse(overtimeResponse)
}

function fieldOptions(field) {
  if (field.options === 'employees') return employeeOptions.value
  if (field.options === 'shiftments') return shiftOptions.value
  return []
}

function formatValue(item, column) {
  const value = item[column.key]

  if (column.formatter === 'employee') return item.employee ? `${item.employee.code || '-'} - ${item.employee.fullName || '-'}` : '-'
  if (column.formatter === 'shiftment') return item.shiftment ? `${item.shiftment.code || '-'} - ${item.shiftment.name || '-'}` : '-'
  if (column.formatter === 'date') return value ? String(value).slice(0, 10) : '-'
  if (column.formatter === 'time') return formatTime(value)
  if (column.formatter === 'timeRange') return `${formatTime(item.startHour)} - ${formatTime(item.endHour)}`
  if (column.formatter === 'decimal') return value === null || value === undefined ? '-' : Number(value).toLocaleString('id-ID')
  if (column.formatter === 'yesNo') return value ? 'Ya' : 'Tidak'

  return value || '-'
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '-'
}

function normalizeTimeInput(value) {
  return value ? String(value).slice(0, 5) : ''
}

watch(activeTab, async () => {
  filters.value = defaultFilters()
  await fetchActiveItems()
})

onMounted(async () => {
  await Promise.all([fetchEmployees(), fetchShiftments()])
  await fetchScheduleData()
})
</script>

<style scoped>
.shift-page {
  width: 100%;
}
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}
.page-head h1 {
  font-size: 16px;
  font-weight: 500;
}
.page-head p {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.tab-btn {
  border: 1px solid var(--color-border-tertiary);
  background: #fff;
  border-radius: 7px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
}
.tab-btn.active {
  background: #eeedfe;
  border-color: #534ab7;
  color: #534ab7;
  font-weight: 500;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.filter-input {
  min-width: 220px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-tertiary);
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: #fff;
}
.date-input {
  min-width: 150px;
}
.summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.summary-item {
  background: #fff;
  border: 1px solid var(--color-border-tertiary);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.summary-item span {
  color: var(--color-text-tertiary);
  font-size: 12px;
}
.summary-item strong {
  color: var(--color-text-primary);
  font-size: 15px;
}
.table-wrap {
  background: #fff;
  border: 1px solid var(--color-border-tertiary);
  border-radius: 8px;
  overflow: auto;
}
.list-table {
  width: 100%;
  min-width: 880px;
  border-collapse: collapse;
}
.list-table th,
.list-table td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--color-border-tertiary);
  text-align: left;
  font-size: 13px;
  vertical-align: middle;
}
.list-table th {
  color: var(--color-text-secondary);
  font-weight: 600;
  background: #fafafa;
}
.actions {
  display: flex;
  gap: 6px;
}
.btn-danger {
  background: #fcebeb;
  color: #a32d2d;
}
.badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f5f4f0;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
}
.badge.active {
  background: #e9f8ef;
  color: #237a45;
}
.loading-ph,
.empty-ph {
  text-align: center;
  padding: 40px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 620px;
  max-width: 92%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,.15);
}
.modal-title {
  font-size: 15px;
  font-weight: 500;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.field.full {
  grid-column: 1 / -1;
}
.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border-tertiary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
}
.check-row {
  min-height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.check-row input {
  width: auto;
}
.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
.spinner-sm {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  display: inline-block;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .summary-row {
    grid-template-columns: 1fr;
  }
  .filter-input {
    min-width: 100%;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
