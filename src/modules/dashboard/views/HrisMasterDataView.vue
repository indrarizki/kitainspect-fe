<template>
  <div>
    <div class="page-head">
      <div>
        <h1>HRIS Master Data</h1>
        <p>Kelola data referensi HRIS</p>
      </div>
      <button class="btn btn-primary" @click="openForm()">Tambah {{ activeConfig.label }}</button>
    </div>

    <div class="tabs">
      <button
        v-for="item in resources"
        :key="item.key"
        class="tab-btn"
        :class="{ active: activeResource === item.key }"
        @click="setResource(item.key)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="toolbar">
      <input v-model="search" class="filter-input" placeholder="Cari data..." @keyup.enter="fetchItems" />
      <button class="btn btn-secondary" @click="fetchItems">Cari</button>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="loading-ph">Memuat...</div>
      <div v-else-if="!items.length" class="empty-ph">Belum ada data.</div>

      <table v-else class="list-table">
        <thead>
          <tr>
            <th v-for="column in activeConfig.columns" :key="column.key">{{ column.label }}</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td v-for="column in activeConfig.columns" :key="column.key">
              {{ formatValue(item, column) }}
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
          <label v-for="field in activeConfig.fields" :key="field.key" class="field">
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
import { hrisMasterDataService } from '@/services'

const resources = [
  {
    key: 'job-levels',
    label: 'Job Level',
    columns: [
      { key: 'code', label: 'Kode' },
      { key: 'name', label: 'Nama' },
    ],
    fields: [
      { key: 'code', label: 'Kode', maxlength: 7 },
      { key: 'name', label: 'Nama' },
    ],
  },
  {
    key: 'job-titles',
    label: 'Job Title',
    columns: [
      { key: 'code', label: 'Kode' },
      { key: 'name', label: 'Nama' },
      { key: 'job_level_id', label: 'Job Level', formatter: 'jobLevel' },
    ],
    fields: [
      { key: 'code', label: 'Kode', maxlength: 9 },
      { key: 'name', label: 'Nama' },
      { key: 'job_level_id', label: 'Job Level', type: 'select', options: 'jobLevels' },
    ],
  },
  {
    key: 'contracts',
    label: 'Contract',
    columns: [
      { key: 'letterNumber', label: 'Nomor' },
      { key: 'subject', label: 'Subject' },
      { key: 'type', label: 'Tipe' },
      { key: 'startDate', label: 'Mulai', formatter: 'date' },
      { key: 'endDate', label: 'Selesai', formatter: 'date' },
      { key: 'used', label: 'Status', formatter: 'used' },
    ],
    fields: [
      { key: 'type', label: 'Tipe', maxlength: 1 },
      { key: 'letterNumber', label: 'Nomor Surat', maxlength: 27 },
      { key: 'subject', label: 'Subject' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'startDate', label: 'Tanggal Mulai', type: 'date' },
      { key: 'endDate', label: 'Tanggal Selesai', type: 'date' },
      { key: 'signedDate', label: 'Tanggal Tanda Tangan', type: 'date' },
      { key: 'used', label: 'Status', type: 'checkbox', checkLabel: 'Sudah digunakan' },
    ],
  },
  {
    key: 'salary-components',
    label: 'Salary Component',
    columns: [
      { key: 'code', label: 'Kode' },
      { key: 'name', label: 'Nama' },
      { key: 'state', label: 'Tipe', formatter: 'salaryState' },
      { key: 'fixed', label: 'Fixed', formatter: 'yesNo' },
    ],
    fields: [
      { key: 'code', label: 'Kode', maxlength: 7 },
      { key: 'name', label: 'Nama' },
      {
        key: 'state',
        label: 'Tipe',
        type: 'select',
        options: [
          { value: 'E', label: 'Earning' },
          { value: 'D', label: 'Deduction' },
          { value: 'A', label: 'Adjustment' },
        ],
      },
      { key: 'fixed', label: 'Fixed', type: 'checkbox', checkLabel: 'Nilai tetap' },
    ],
  },
]

const activeResource = ref('job-levels')
const items = ref([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({})
const lookups = ref({
  jobLevels: [],
})

const activeConfig = computed(() => {
  return resources.find((item) => item.key === activeResource.value) || resources[0]
})

function defaultForm() {
  return activeConfig.value.fields.reduce((payload, field) => {
    payload[field.key] = field.type === 'checkbox' ? false : ''
    return payload
  }, {})
}

async function fetchItems() {
  loading.value = true
  try {
    const params = {}
    if (search.value) params.search = search.value
    const res = await hrisMasterDataService.list(activeResource.value, params)
    items.value = res.data?.data ?? res.data ?? []
  } catch (error) {
    console.error('Failed to load HRIS master data', error)
    items.value = []
  } finally {
    loading.value = false
  }
}

async function fetchLookups() {
  try {
    const jobLevels = await hrisMasterDataService.list('job-levels')
    lookups.value.jobLevels = (jobLevels.data?.data ?? jobLevels.data ?? []).map((item) => ({
      value: item.id,
      label: `${item.code || '-'} - ${item.name}`,
    }))
  } catch (error) {
    console.error('Failed to load HRIS master lookups', error)
  }
}

function setResource(resource) {
  activeResource.value = resource
}

function openForm(item = null) {
  editingItem.value = item
  form.value = item ? { ...defaultForm(), ...item } : defaultForm()
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingItem.value = null
  form.value = {}
}

function normalizePayload() {
  const payload = { ...form.value }

  activeConfig.value.fields.forEach((field) => {
    if (payload[field.key] === '') payload[field.key] = null
    if (field.type === 'checkbox') payload[field.key] = Boolean(payload[field.key])
  })

  return payload
}

async function submitForm() {
  saving.value = true
  try {
    const payload = normalizePayload()
    if (editingItem.value) {
      await hrisMasterDataService.update(activeResource.value, editingItem.value.id, payload)
    } else {
      await hrisMasterDataService.create(activeResource.value, payload)
    }
    closeForm()
    await Promise.all([fetchItems(), fetchLookups()])
  } catch (error) {
    console.error('Failed to save HRIS master data', error)
    alert('Gagal menyimpan data')
  } finally {
    saving.value = false
  }
}

async function removeItem(item) {
  if (!confirm(`Hapus ${activeConfig.value.label} ini?`)) return

  try {
    await hrisMasterDataService.delete(activeResource.value, item.id)
    await Promise.all([fetchItems(), fetchLookups()])
  } catch (error) {
    console.error('Failed to delete HRIS master data', error)
    alert('Gagal menghapus data')
  }
}

function fieldOptions(field) {
  if (Array.isArray(field.options)) return field.options
  return lookups.value[field.options] || []
}

function formatValue(item, column) {
  const value = item[column.key]

  if (column.formatter === 'date') return value ? String(value).slice(0, 10) : '-'
  if (column.formatter === 'used') return value ? 'Digunakan' : 'Draft'
  if (column.formatter === 'yesNo') return value ? 'Ya' : 'Tidak'
  if (column.formatter === 'salaryState') {
    return { E: 'Earning', D: 'Deduction', A: 'Adjustment' }[value] || '-'
  }
  if (column.formatter === 'jobLevel') {
    return lookups.value.jobLevels.find((option) => option.value === value)?.label || '-'
  }

  return value || '-'
}

watch(activeResource, () => {
  search.value = ''
  fetchItems()
})

onMounted(async () => {
  await fetchLookups()
  await fetchItems()
})
</script>

<style scoped>
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
}
.filter-input {
  min-width: 260px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-tertiary);
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}
.table-wrap {
  background: #fff;
  border: 1px solid var(--color-border-tertiary);
  border-radius: 8px;
  overflow: hidden;
}
.list-table {
  width: 100%;
  border-collapse: collapse;
}
.list-table th,
.list-table td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--color-border-tertiary);
  text-align: left;
  font-size: 13px;
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
  width: 560px;
  max-width: 92%;
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
.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border-tertiary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
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
@keyframes spin { to { transform: rotate(360deg) } }
</style>
