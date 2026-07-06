<template>
  <div>
    <!-- Filter row -->
    <div class="filter-row">
      <button
        v-for="f in filters" :key="f.key"
        class="filter-btn"
        :class="{ active: activeFilter === f.key }"
        @click="setFilter(f.key)"
      >{{ f.label }}</button>

      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="search" type="text" placeholder="Cari inspeksi..." @input="debouncedFetch" />
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div v-if="loading" class="loading-state">Memuat data...</div>
      <div v-else-if="!items.length" class="empty-state">
        <div style="font-size:32px">📭</div>
        <div>Tidak ada item dalam antrian</div>
      </div>
      <table v-else>
        <thead>
          <tr>
            <th style="width:32%">Inspeksi</th>
            <th style="width:14%">Inspector</th>
            <th style="width:12%">Tgl Submit</th>
            <th style="width:11%">Status</th>
            <th style="width:12%">Step</th>
            <th style="width:19%">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" @click="openDetail(item)">
            <td>
              <div class="insp-title">{{ item.inspection?.title }}</div>
              <div class="insp-meta">{{ item.inspection?.location ?? '-' }}</div>
            </td>
            <td class="text-secondary">{{ item.inspection?.assigned_to?.name }}</td>
            <td class="text-muted">{{ formatDate(item.inspection?.submitted_at) }}</td>
            <td><span class="badge" :class="statusClass(item.inspection?.status)">{{ statusLabel(item.inspection?.status) }}</span></td>
            <td>
              <div class="step-wrap">
                <div class="pip" :class="item.step_order >= 1 ? 'done' : 'wait'" />
                <div class="pip-line" />
                <div class="pip" :class="item.step_order >= 2 ? 'active' : 'wait'" />
                <span class="step-label">{{ item.step_order }}/2</span>
              </div>
            </td>
            <td @click.stop>
              <div class="action-wrap">
                <button class="btn btn-secondary btn-sm" @click="openModal(item, 'revise')">Revisi</button>
                <button class="btn btn-danger btn-sm" @click="openModal(item, 'reject')">Tolak</button>
                <button class="btn btn-success btn-sm" @click="openModal(item, 'approve')">Setujui</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="meta.last_page > 1">
      <button class="pg-btn" :disabled="meta.current_page === 1" @click="fetchPage(meta.current_page - 1)">‹</button>
      <button
        v-for="p in meta.last_page" :key="p"
        class="pg-btn"
        :class="{ active: p === meta.current_page }"
        @click="fetchPage(p)"
      >{{ p }}</button>
      <button class="pg-btn" :disabled="meta.current_page === meta.last_page" @click="fetchPage(meta.current_page + 1)">›</button>
    </div>

    <!-- Action Modal -->
    <Teleport to="body">
      <div v-if="modal.open" class="modal-overlay" @click.self="modal.open = false">
        <div class="modal">
          <div class="modal-title">
            {{ modal.action === 'approve' ? '✅ Setujui' : modal.action === 'reject' ? '❌ Tolak' : '✏️ Minta Revisi' }}
            Inspeksi
          </div>
          <div class="modal-sub">{{ modal.item?.inspection?.title }}</div>

          <div class="field" style="margin-top:16px">
            <label>{{ modal.action === 'approve' ? 'Catatan (opsional)' : 'Alasan (wajib)' }}</label>
            <textarea v-model="modal.remarks" rows="4" :placeholder="modal.action === 'approve' ? 'Tambahkan catatan...' : 'Tulis alasan...'" />
            <span class="field-error" v-if="modal.error">{{ modal.error }}</span>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="modal.open = false">Batal</button>
            <button
              class="btn"
              :class="modal.action === 'approve' ? 'btn-success' : modal.action === 'reject' ? 'btn-danger' : 'btn-primary'"
              :disabled="modal.loading"
              @click="submitAction"
            >
              <span v-if="modal.loading" class="spinner-sm" />
              {{ modal.action === 'approve' ? 'Setujui' : modal.action === 'reject' ? 'Tolak' : 'Kirim Revisi' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { approvalService } from '@/services'
import { useToast } from '@/composables'
import { statusLabel, statusClass } from '@/utils/statusHelper'

const router     = useRouter()
const { success, error: toastError } = useToast()

const loading     = ref(false)
const items       = ref([])
const meta        = ref({ current_page: 1, last_page: 1 })
const activeFilter = ref('all')
const search      = ref('')
let _debounce     = null

const filters = [
  { key: 'all',      label: 'Semua' },
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'rejected', label: 'Ditolak' },
]

const modal = reactive({
  open: false, item: null, action: 'approve',
  remarks: '', error: '', loading: false,
})

async function fetchPage(page = 1) {
  loading.value = true
  try {
    const params = { page, per_page: 15 }
    if (activeFilter.value !== 'all') params.status = activeFilter.value
    if (search.value) params.search = search.value
    const { data } = await approvalService.list(params)
    items.value = data.data ?? []
    meta.value  = data.meta ?? { current_page: 1, last_page: 1 }
  } catch { toastError('Gagal memuat data approval.') }
  finally { loading.value = false }
}

function setFilter(key) {
  activeFilter.value = key
  fetchPage(1)
}

function debouncedFetch() {
  clearTimeout(_debounce)
  _debounce = setTimeout(() => fetchPage(1), 400)
}

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
}

function openDetail(item) {
  router.push(`/approvals/${item.id}`)
}

function openModal(item, action) {
  modal.open    = true
  modal.item    = item
  modal.action  = action
  modal.remarks = ''
  modal.error   = ''
}

async function submitAction() {
  if (modal.action !== 'approve' && !modal.remarks.trim()) {
    modal.error = 'Alasan wajib diisi.'
    return
  }
  modal.loading = true
  modal.error   = ''
  try {
    const payload = { remarks: modal.remarks }
    if (modal.action === 'approve')      await approvalService.approve(modal.item.id, payload)
    else if (modal.action === 'reject')  await approvalService.reject(modal.item.id, payload)
    else                                 await approvalService.revise(modal.item.id, payload)

    success(modal.action === 'approve' ? 'Inspeksi disetujui.' : modal.action === 'reject' ? 'Inspeksi ditolak.' : 'Permintaan revisi dikirim.')
    modal.open = false
    fetchPage(meta.value.current_page)
  } catch (e) {
    modal.error = e.response?.data?.message ?? 'Terjadi kesalahan.'
  } finally {
    modal.loading = false
  }
}

onMounted(() => fetchPage())
</script>

<style scoped>
.filter-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.filter-btn { padding: 6px 14px; border: 1px solid #d8d7cf; border-radius: 20px; font-size: 12.5px; background: #fff; color: #666; cursor: pointer; transition: all .12s; }
.filter-btn:hover { border-color: #534AB7; color: #534AB7; }
.filter-btn.active { background: #534AB7; color: #fff; border-color: #534AB7; }
.search-wrap { margin-left: auto; position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #aaa; }
.search-wrap input { padding: 7px 12px 7px 32px; border: 1px solid #d8d7cf; border-radius: 7px; font-size: 13px; outline: none; width: 210px; }
.search-wrap input:focus { border-color: #534AB7; }
.loading-state, .empty-state { text-align: center; padding: 48px 24px; color: #aaa; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.insp-title { font-size: 13px; color: #1a1a18; font-weight: 500; }
.insp-meta { font-size: 11.5px; color: #aaa; margin-top: 1px; }
.text-secondary { color: #555; }
.text-muted { color: #aaa; font-size: 12.5px; }
.step-wrap { display: flex; align-items: center; gap: 3px; }
.pip { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid #d8d7cf; }
.pip.done { background: #0F6E56; border-color: #0F6E56; }
.pip.active { background: #534AB7; border-color: #534AB7; }
.pip.wait { background: #f0efe8; }
.pip-line { width: 12px; height: 1.5px; background: #d8d7cf; }
.step-label { font-size: 11px; color: #aaa; margin-left: 4px; }
.action-wrap { display: flex; gap: 5px; }
.pagination { display: flex; gap: 5px; margin-top: 14px; justify-content: flex-end; }
.pg-btn { width: 30px; height: 30px; border: 1px solid #d8d7cf; border-radius: 6px; background: #fff; font-size: 13px; color: #555; cursor: pointer; }
.pg-btn:disabled { opacity: .4; pointer-events: none; }
.pg-btn.active { background: #534AB7; color: #fff; border-color: #534AB7; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #fff; border-radius: 12px; padding: 24px; width: 440px; max-width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,.15); }
.modal-title { font-size: 16px; font-weight: 500; color: #1a1a18; margin-bottom: 4px; }
.modal-sub { font-size: 13px; color: #888; }
.modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.spinner-sm { width: 13px; height: 13px; border: 2px solid rgba(0,0,0,.15); border-top-color: currentColor; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>