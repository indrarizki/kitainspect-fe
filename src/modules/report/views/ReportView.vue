<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div>
        <h1 style="font-size:16px;font-weight:500">Laporan Inspeksi</h1>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Filter dan export laporan</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" :disabled="!items.length || exportingExcel" @click="exportExcel">
          <span v-if="exportingExcel" class="spinner-sm"/>
          📊 Export Excel
        </button>
        <button class="btn btn-primary" :disabled="!selectedIds.length || exportingPdf" @click="exportPdfBulk">
          <span v-if="exportingPdf" class="spinner-sm"/>
          📄 Export PDF ({{ selectedIds.length }})
        </button>
      </div>
    </div>

    <!-- Filter card -->
    <div class="card" style="margin-bottom:14px">
      <div style="font-size:13px;font-weight:500;margin-bottom:12px">Filter Laporan</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        <div class="field">
          <label>Status</label>
          <select v-model="filters.status">
            <option value="">Semua status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="in_review">In Review</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div class="field">
          <label>Tanggal Dari</label>
          <input v-model="filters.date_from" type="date"/>
        </div>
        <div class="field">
          <label>Tanggal Sampai</label>
          <input v-model="filters.date_to" type="date"/>
        </div>
        <div class="field">
          <label>Cari PO / Customer</label>
          <input v-model="filters.search" type="text" placeholder="Ketik untuk cari..."/>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-primary" @click="fetchPage(1)">🔍 Filter</button>
        <button class="btn btn-secondary" @click="resetFilters">Reset</button>
        <div style="margin-left:auto;font-size:12.5px;color:var(--color-text-tertiary);align-self:center">
          {{ meta.total ?? 0 }} inspeksi ditemukan
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div v-if="loading" class="loading-ph">Memuat...</div>
      <div v-else-if="!items.length" class="empty-ph">
        <div style="font-size:32px;margin-bottom:8px">📭</div>
        Tidak ada inspeksi ditemukan. Coba ubah filter.
      </div>
      <table v-else>
        <thead>
          <tr>
            <th style="width:36px">
              <input type="checkbox" :checked="allSelected" @change="toggleAll"/>
            </th>
            <th>PO / Inspeksi</th>
            <th>Customer</th>
            <th>Produk</th>
            <th>Tipe</th>
            <th>Tgl Inspeksi</th>
            <th>Inspector</th>
            <th>Status</th>
            <th>Hasil</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <input type="checkbox" :value="item.id" v-model="selectedIds"/>
            </td>
            <td>
              <div style="font-weight:500">{{ item.po_number || '—' }}</div>
              <div style="font-size:11px;color:var(--color-text-tertiary)">{{ item.id.slice(0,8) }}...</div>
            </td>
            <td style="color:var(--color-text-secondary)">{{ item.customer || '—' }}</td>
            <td>
              <div style="font-size:13px">{{ item.product_name || '—' }}</div>
              <div style="font-size:11px;color:var(--color-text-tertiary)">{{ item.manufacturer }}</div>
            </td>
            <td>
              <span class="badge badge-review" style="font-size:11px">
                {{ item.template?.inspection_type?.name ?? '—' }}
              </span>
            </td>
            <td style="color:var(--color-text-secondary);font-size:12.5px">{{ item.inspection_date || '—' }}</td>
            <td style="color:var(--color-text-secondary);font-size:12.5px">{{ item.assigned_to?.name }}</td>
            <td><span class="badge" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td>
            <td>
              <span :class="`result-${overallResult(item)}`" style="font-size:12px;font-weight:600">
                {{ { pass:'✅ PASS', fail:'❌ FAIL', pending:'⏳', conditional:'⚠️' }[overallResult(item)] }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:5px">
                <button class="btn btn-secondary btn-sm" @click="$router.push(`/inspections/${item.id}`)">Detail</button>
                <button class="btn btn-primary btn-sm" :disabled="exportingPdf" @click="exportSinglePdf(item)">PDF</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px">
      <div style="font-size:12.5px;color:var(--color-text-tertiary)">
        {{ selectedIds.length > 0 ? `${selectedIds.length} dipilih` : '' }}
      </div>
      <div style="display:flex;gap:5px">
        <button v-for="p in meta.last_page" :key="p" class="pg-btn"
          :class="{active:p===meta.current_page}" @click="fetchPage(p)">{{ p }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { reportService } from '@/services'
import { useToast, useDownload } from '@/composables'
import { statusLabel, statusClass } from '@/utils/statusHelper'

const router = useRouter()
const { success, error: toastError } = useToast()
const { download } = useDownload()

const loading       = ref(false)
const exportingPdf  = ref(false)
const exportingExcel = ref(false)
const items         = ref([])
const meta          = ref({ current_page:1, last_page:1, total:0 })
const selectedIds   = ref([])

const filters = ref({
  status: '', date_from: '', date_to: '', search: '',
})

const allSelected = computed(() =>
  items.value.length > 0 && selectedIds.value.length === items.value.length
)

function toggleAll() {
  selectedIds.value = allSelected.value ? [] : items.value.map(i => i.id)
}

function overallResult(order) {
  if (!order.items?.length) return 'pending'
  if (order.items.some(i => i.result === 'fail')) return 'fail'
  if (order.items.every(i => i.result === 'pass')) return 'pass'
  return 'conditional'
}

function resetFilters() {
  filters.value = { status:'', date_from:'', date_to:'', search:'' }
  fetchPage(1)
}

async function fetchPage(page=1) {
  loading.value  = true
  selectedIds.value = []
  try {
    const params = { page, per_page:20 }
    if (filters.value.status)    params.status    = filters.value.status
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    if (filters.value.search)    params.search    = filters.value.search
    const { data } = await reportService.list(params)
    items.value = data.data ?? []
    meta.value  = { ...data.meta, total: data.meta?.total ?? 0 }
  } finally { loading.value = false }
}

async function exportSinglePdf(order) {
  exportingPdf.value = true
  try {
    const { data } = await reportService.exportPdf({ inspection_id: order.id })
    download(data, `inspeksi-${order.po_number ?? order.id}.pdf`)
    success('PDF berhasil didownload.')
  } catch { toastError('Gagal export PDF.') }
  finally { exportingPdf.value = false }
}

async function exportPdfBulk() {
  if (!selectedIds.value.length) return
  // Export satu per satu
  exportingPdf.value = true
  try {
    for (const id of selectedIds.value) {
      const order = items.value.find(i => i.id === id)
      const { data } = await reportService.exportPdf({ inspection_id: id })
      download(data, `inspeksi-${order?.po_number ?? id}.pdf`)
    }
    success(`${selectedIds.value.length} PDF berhasil didownload.`)
  } catch { toastError('Gagal export PDF.') }
  finally { exportingPdf.value = false }
}

async function exportExcel() {
  exportingExcel.value = true
  try {
    const params = {}
    if (filters.value.status)    params.status    = filters.value.status
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to)   params.date_to   = filters.value.date_to
    const { data } = await reportService.exportExcel(params)
    const filename = `laporan-inspeksi-${new Date().toISOString().slice(0,10)}.xlsx`
    download(data, filename)
    success('Excel berhasil didownload.')
  } catch { toastError('Gagal export Excel.') }
  finally { exportingExcel.value = false }
}

onMounted(() => fetchPage())
</script>

<style scoped>
.result-pass{color:#0F6E56;} .result-fail{color:#A32D2D;} .result-pending{color:#888;} .result-conditional{color:#854F0B;}
.loading-ph,.empty-ph{text-align:center;padding:48px;color:var(--color-text-tertiary);font-size:13px;}
.pg-btn{width:30px;height:30px;border:1px solid var(--color-border-tertiary);border-radius:6px;background:#fff;font-size:13px;cursor:pointer;}
.pg-btn.active{background:#534AB7;color:#fff;border-color:#534AB7;}
.spinner-sm{width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg)}}
</style>