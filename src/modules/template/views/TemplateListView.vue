<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div>
        <h1 style="font-size:16px;font-weight:500">Form Template</h1>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Kelola template inspeksi per tipe</p>
      </div>
      <button v-if="can('template.create')" class="btn btn-primary" @click="$router.push('/templates/create')">+ Buat Template</button>
    </div>

    <!-- Filters -->
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <button v-for="f in typeFilters" :key="f.value" class="filter-btn" :class="{active: activeType===f.value}" @click="setType(f.value)">
        {{ f.label }}
      </button>
      <div class="search-wrap" style="margin-left:auto">
        <input v-model="search" placeholder="Cari template..." @input="debounceFetch" />
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="loading-ph">Memuat...</div>
      <div v-else-if="!items.length" class="empty-ph">Belum ada template.</div>
      <table v-else>
        <thead>
          <tr>
            <th>Nama Template</th>
            <th>Tipe</th>
            <th>Versi</th>
            <th>Sampling</th>
            <th>Unit</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in items" :key="t.id">
            <td>
              <div style="font-weight:500">{{ t.name }}</div>
              <div style="font-size:11.5px;color:var(--color-text-tertiary)">{{ t.company?.name }}</div>
            </td>
            <td><span class="badge badge-review">{{ t.inspection_type?.name }}</span></td>
            <td style="color:var(--color-text-secondary)">v{{ t.version }}</td>
            <td style="font-size:12.5px">{{ samplingLabel(t.sampling_method) }}</td>
            <td style="font-size:12.5px;text-transform:uppercase">{{ t.default_unit }}</td>
            <td>
              <span class="badge" :class="t.is_published ? 'badge-approved' : 'badge-draft'">
                {{ t.is_published ? 'Published' : 'Draft' }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-secondary btn-sm" @click="$router.push(`/templates/${t.id}/builder`)">Builder</button>
                <button v-if="can('template.publish')" class="btn btn-sm" :class="t.is_published ? 'btn-danger' : 'btn-success'"
                  @click="togglePublish(t)">{{ t.is_published ? 'Unpublish' : 'Publish' }}</button>
                <button v-if="can('template.create')" class="btn btn-secondary btn-sm" @click="duplicate(t.id)">Duplikasi</button>
              </div>
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
import { templateService } from '@/services'
import { usePermission, useToast } from '@/composables'

const { can }   = usePermission()
const { success, error: toastError } = useToast()
const loading   = ref(false)
const items     = ref([])
const meta      = ref({ current_page:1, last_page:1 })
const activeType = ref('')
const search    = ref('')
const typeFilters = ref([{ value:'', label:'Semua' }])
let _deb = null

const samplingLabel = m => ({ aql_2_5:'AQL 2.5%', check_all:'100% Check All', custom:'Custom' })[m] ?? m

async function fetchPage(page=1) {
  loading.value = true
  try {
    const params = { page, per_page:15 }
    if (activeType.value) params.inspection_type = activeType.value
    if (search.value) params.search = search.value
    const response = await templateService.list(params)
    const result = response.data 

    if(Array.isArray(result)) {
      items.value = result
      meta.value = { current_page:1, last_page:1 }
    } else {
      items.value = result.data ?? []
      meta.value  = result.meta ?? { current_page:1, last_page:1 }
    }
    
  } catch (e) {
    console.error("Gagal memuat data:", e)
  } finally {
    loading.value = false
  }
}

function setType(v) { activeType.value = v; fetchPage(1) }
function debounceFetch() { clearTimeout(_deb); _deb = setTimeout(()=>fetchPage(1), 400) }

async function togglePublish(t) {
  try {
    await templateService.publish(t.id)
    success(t.is_published ? 'Template di-unpublish.' : 'Template berhasil dipublish.')
    fetchPage(meta.value.current_page)
  } catch(e) { toastError(e.response?.data?.message ?? 'Gagal.') }
}

async function duplicate(id) {
  try {
    await templateService.duplicate(id)
    success('Template berhasil diduplikasi.')
    fetchPage(1)
  } catch { toastError('Gagal menduplikasi.') }
}

onMounted(async () => {
  // Load inspection types for filter
  try {
    const { data } = await templateService.types()
    typeFilters.value = [{ value:'', label:'Semua' }, ...(data.types ?? []).map(t=>({ value:t.slug, label:t.name }))]
  } catch {}
  fetchPage()
})
</script>

<style scoped>
.filter-btn { padding:6px 14px;border:1px solid var(--color-border-tertiary);border-radius:20px;font-size:12.5px;background:#fff;color:#666;cursor:pointer }
.filter-btn.active { background:#534AB7;color:#fff;border-color:#534AB7 }
.search-wrap input { padding:7px 12px;border:1px solid var(--color-border-tertiary);border-radius:7px;font-size:13px;outline:none;width:210px }
.loading-ph,.empty-ph { text-align:center;padding:40px;color:var(--color-text-tertiary);font-size:13px }
.pg-btn { width:30px;height:30px;border:1px solid var(--color-border-tertiary);border-radius:6px;background:#fff;font-size:13px;cursor:pointer }
.pg-btn.active { background:#534AB7;color:#fff;border-color:#534AB7 }
</style>