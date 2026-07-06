<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <h2 style="font-size:16px;font-weight:500">Daftar Inspeksi</h2>
      <button v-if="can('inspection.create')" class="btn btn-primary" @click="$router.push('/inspections/create')">+ Buat Inspeksi</button>
    </div>

    <!-- Filter -->
    <div class="filter-row">
      <button v-for="f in filters" :key="f.key" class="filter-btn" :class="{active: activeFilter===f.key}" @click="setFilter(f.key)">{{ f.label }}</button>
      <div class="search-wrap" style="margin-left:auto;position:relative">
        <input v-model="search" type="text" placeholder="Cari inspeksi..." @input="debouncedFetch" style="padding:7px 12px 7px 12px;border:1px solid #d8d7cf;border-radius:7px;font-size:13px;outline:none;width:210px"/>
      </div>
    </div>

    <div class="table-wrap" style="margin-top:12px">
      <div v-if="loading" style="text-align:center;padding:40px;color:#aaa;font-size:13px">Memuat...</div>
      <div v-else-if="!items.length" style="text-align:center;padding:40px;color:#aaa;font-size:13px">Belum ada inspeksi.</div>
      <table v-else>
        <thead>
          <tr>
            <th>Inspector</th>
            <th>Buyer</th>
            <th>PO</th>
            <th>Status</th>
            <th>Tanggal Inspeksi</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" style="cursor:pointer" @click="$router.push(`/inspections/${item.id}`)">
            <td style="color:#555">{{ item.assigned_to?.name }}</td>
            <td style="color:#555;font-size:12.5px">{{ item.customer }}</td>
            <td style="color:#555;font-size:12.5px">{{ item.po_number }}</td>
            <td><span class="badge" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td>
            <td style="color:#aaa;font-size:12.5px">{{ formatDate(item.created_at) }}</td>
            <td @click.stop>
              <button class="btn btn-secondary btn-sm" @click="$router.push(`/inspections/${item.id}`)">Detail</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div style="display:flex;gap:5px;margin-top:14px;justify-content:flex-end" v-if="meta.last_page > 1">
      <button v-for="p in meta.last_page" :key="p" class="pg-btn" :class="{active: p===meta.current_page}" @click="fetchPage(p)">{{ p }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { inspectionService } from '@/services'
import { usePermission } from '@/composables'
import { statusLabel, statusClass } from '@/utils/statusHelper'

const { can }     = usePermission()
const loading     = ref(false)
const items       = ref([])
const meta        = ref({ current_page: 1, last_page: 1 })
const activeFilter = ref('all')
const search      = ref('')
let _deb = null

const filters = [
  { key: 'all', label: 'Semua' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'in_review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

async function fetchPage(page = 1) {
  loading.value = true
  try {
    const params = { page, per_page: 15 }
    if (activeFilter.value !== 'all') params.status = activeFilter.value
    if (search.value) params.search = search.value
    const { data } = await inspectionService.list(params)
    console.log(data);
    
    items.value = data.data ?? []
    meta.value  = data.meta ?? { current_page: 1, last_page: 1 }
  } finally { loading.value = false }
}

function setFilter(key) { activeFilter.value = key; fetchPage(1) }
function debouncedFetch() { clearTimeout(_deb); _deb = setTimeout(() => fetchPage(1), 400) }
function formatDate(iso) { return iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' }

onMounted(() => fetchPage())
</script>

<style scoped>
.filter-row { display:flex;align-items:center;gap:8px;flex-wrap:wrap }
.filter-btn { padding:6px 14px;border:1px solid #d8d7cf;border-radius:20px;font-size:12.5px;background:#fff;color:#666;cursor:pointer }
.filter-btn:hover { border-color:#534AB7;color:#534AB7 }
.filter-btn.active { background:#534AB7;color:#fff;border-color:#534AB7 }
.pg-btn { width:30px;height:30px;border:1px solid #d8d7cf;border-radius:6px;background:#fff;font-size:13px;color:#555;cursor:pointer }
.pg-btn.active { background:#534AB7;color:#fff;border-color:#534AB7 }
</style>