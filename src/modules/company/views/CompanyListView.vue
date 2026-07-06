<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div>
        <h1 style="font-size:16px;font-weight:500">Manajemen Perusahaan</h1>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Kelola data perusahaan</p>
      </div>
      <button v-if="can('company.create')" class="btn btn-primary" @click="openModal()">+ Tambah Perusahaan</button>
    </div>

    <!-- Filters -->
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <select v-model="activeStatus" @change="fetchPage(1)"
        style="padding:6px 12px;border:1px solid var(--color-border-tertiary);border-radius:7px;font-size:12.5px;outline:none">
        <option value="">Semua status</option>
        <option value="1">Aktif</option>
        <option value="0">Non-aktif</option>
      </select>
      <div class="search-wrap" style="margin-left:auto">
        <input v-model="search" placeholder="Cari nama / kode..." @input="debounceFetch"/>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="loading-ph">Memuat...</div>
      <div v-else-if="!items.length" class="empty-ph">Tidak ada perusahaan ditemukan.</div>
      <table v-else>
        <thead>
          <tr>
            <th>Perusahaan</th>
            <th>Kode</th>
            <th>Total User</th>
            <th>Status</th>
            <th>Dibuat</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in items" :key="c.id">
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="company-avatar">
                  {{ c.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div style="font-weight:500">{{ c.name }}</div>
                  <div v-if="c.logo_url" style="font-size:11px;color:var(--color-text-tertiary)">Logo tersedia</div>
                </div>
              </div>
            </td>
            <td>
              <span style="font-family:var(--font-mono);font-size:12.5px;background:var(--color-background-secondary);padding:2px 8px;border-radius:4px">
                {{ c.code }}
              </span>
            </td>
            <td style="text-align:center;font-weight:500">{{ c.users_count ?? 0 }}</td>
            <td>
              <span class="badge" :class="c.is_active ? 'badge-approved' : 'badge-rejected'">
                {{ c.is_active ? 'Aktif' : 'Non-aktif' }}
              </span>
            </td>
            <td style="color:var(--color-text-tertiary);font-size:12px">{{ formatDate(c.created_at) }}</td>
            <td>
              <div style="display:flex;gap:5px">
                <button class="btn btn-secondary btn-sm" @click="openModal(c)">Edit</button>
                <button v-if="c.is_active" class="btn btn-danger btn-sm" @click="deactivate(c)">Non-aktifkan</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div style="display:flex;gap:5px;margin-top:14px;justify-content:flex-end" v-if="meta.last_page > 1">
      <button v-for="p in meta.last_page" :key="p" class="pg-btn" :class="{active:p===meta.current_page}" @click="fetchPage(p)">{{ p }}</button>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="modal.open" class="modal-overlay" @click.self="modal.open=false">
        <div class="modal">
          <div class="modal-title">{{ modal.id ? 'Edit Perusahaan' : 'Tambah Perusahaan' }}</div>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
            <div class="field">
              <label>Nama Perusahaan *</label>
              <input v-model="modal.name" type="text" placeholder="e.g. PT. Revive Wood Products"/>
            </div>
            <div class="field">
              <label>Kode Unik *</label>
              <input v-model="modal.code" type="text" placeholder="e.g. REVIVE" :disabled="!!modal.id"
                style="text-transform:uppercase" @input="modal.code = modal.code.toUpperCase()"/>
              <div style="font-size:11px;color:var(--color-text-tertiary);margin-top:3px">Kode tidak dapat diubah setelah dibuat.</div>
            </div>
            <div class="field">
              <label>Logo URL (opsional)</label>
              <input v-model="modal.logo_url" type="url" placeholder="https://..."/>
            </div>
            <div >
                <input type="checkbox" v-model="modal.is_active" />
                <span><label for="checkbox">&nbsp; Is Active</label></span>
            </div>
          </div>
          <div v-if="modal.error" style="margin-top:10px;font-size:12.5px;color:#A32D2D;background:#FCEBEB;padding:8px 12px;border-radius:6px">
            {{ modal.error }}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="modal.open=false">Batal</button>
            <button class="btn btn-primary" :disabled="modal.loading" @click="saveCompany">
              <span v-if="modal.loading" class="spinner-sm"/>
              {{ modal.loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { companyService } from '@/services'
import { usePermission, useToast } from '@/composables'

const { can }   = usePermission()
const { success, error: toastError } = useToast()

const loading     = ref(false)
const items       = ref([])
const meta        = ref({ current_page:1, last_page:1 })
const activeStatus = ref('')
const search      = ref('')
let _deb = null

const modal = ref({ open:false, id:null, name:'', code:'', logo_url:'', is_active:true, loading:false, error:'' })

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : '—'
}

function openModal(c=null) {
  modal.value = c
    ? { open:true, id:c.id, name:c.name, code:c.code, logo_url:c.logo_url??'', is_active:c.is_active ?? true, loading:false, error:'' }
    : { open:true, id:null, name:'', code:'', logo_url:'', is_active:true, loading:false, error:'' }
}

async function saveCompany() {
  if (!modal.value.name || !modal.value.code) {
    modal.value.error = 'Nama dan kode wajib diisi.'
    return
  }
  modal.value.loading = true
  modal.value.error   = ''
  try {
    const payload = {
      name:     modal.value.name,
      code:     modal.value.code,
      logo_url: modal.value.logo_url || undefined,
      is_active: modal.value.is_active ?? true,   
    }
    if (modal.value.id) await companyService.update(modal.value.id, payload)
    else                await companyService.create(payload)
    success(modal.value.id ? 'Perusahaan berhasil diperbarui.' : 'Perusahaan berhasil ditambahkan.')
    modal.value.open = false
    fetchPage(meta.value.current_page)
  } catch(e) {
    modal.value.error = e.response?.data?.message ?? 'Gagal menyimpan.'
  } finally { modal.value.loading = false }
}

async function deactivate(c) {
  if (!confirm(`Non-aktifkan ${c.name}?`)) return
  try {
    await companyService.delete(c.id)
    success('Perusahaan berhasil dinonaktifkan.')
    fetchPage(meta.value.current_page)
  } catch(e) { toastError(e.response?.data?.message ?? 'Gagal.') }
}

async function fetchPage(page = 1) {
  loading.value = true
  try {
    const params = { page, per_page: 15 }
    if (activeStatus.value !== '') params.is_active = activeStatus.value
    if (search.value) params.search = search.value
    const response = await companyService.list(params)
    const result = response.data 

    if (Array.isArray(result)) {
      items.value = result
      meta.value = { current_page: 1, last_page: 1 }
    } else if (result.data) {
      items.value = result.data
      meta.value = result.meta || { current_page: 1, last_page: 1 }
    }

  } catch (e) {
    console.error("Gagal memuat data:", e)
  } finally {
    loading.value = false
  }
}

function debounceFetch() { clearTimeout(_deb); _deb = setTimeout(()=>fetchPage(1), 400) }

onMounted(() => fetchPage())
</script>

<style scoped>
.search-wrap input { padding:7px 12px;border:1px solid var(--color-border-tertiary);border-radius:7px;font-size:13px;outline:none;width:220px }
.company-avatar { width:34px;height:34px;border-radius:8px;background:#534AB7;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.loading-ph,.empty-ph { text-align:center;padding:40px;color:var(--color-text-tertiary);font-size:13px }
.pg-btn { width:30px;height:30px;border:1px solid var(--color-border-tertiary);border-radius:6px;background:#fff;font-size:13px;cursor:pointer }
.pg-btn.active { background:#534AB7;color:#fff;border-color:#534AB7 }
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100 }
.modal { background:#fff;border-radius:12px;padding:24px;width:440px;max-width:92%;box-shadow:0 8px 32px rgba(0,0,0,.15) }
.modal-title { font-size:15px;font-weight:500 }
.modal-footer { display:flex;gap:8px;justify-content:flex-end;margin-top:16px }
.spinner-sm { width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block }
@keyframes spin { to { transform:rotate(360deg) } }
</style>