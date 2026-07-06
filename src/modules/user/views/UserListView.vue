<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div>
        <h1 style="font-size:16px;font-weight:500">Manajemen Pengguna</h1>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Kelola user dan hak akses</p>
      </div>
      <button v-if="can('user.create')" class="btn btn-primary" @click="openModal()">+ Tambah User</button>
    </div>

    <!-- Filters -->
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <button v-for="f in roleFilters" :key="f.value" class="filter-btn" :class="{active:activeRole===f.value}" @click="setRole(f.value)">
        {{ f.label }}
      </button>
      <select v-model="activeStatus" @change="fetchPage(1)" style="padding:6px 12px;border:1px solid var(--color-border-tertiary);border-radius:7px;font-size:12.5px;outline:none">
        <option value="">Semua status</option>
        <option value="1">Aktif</option>
        <option value="0">Non-aktif</option>
      </select>
      <div class="search-wrap" style="margin-left:auto">
        <input v-model="search" placeholder="Cari nama / email..." @input="debounceFetch"/>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="loading-ph">Memuat...</div>
      <div v-else-if="!items.length" class="empty-ph">Tidak ada user ditemukan.</div>
      <table v-else>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Perusahaan</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in items" :key="u.id">
            <td>
              <div style="display:flex;align-items:center;gap:9px">
                <div class="avatar-sm" :style="`background:${roleColor(u.role?.slug)};color:#fff`">
                  {{ initials(u.name) }}
                </div>
                <span style="font-weight:500">{{ u.name }}</span>
              </div>
            </td>
            <td style="color:var(--color-text-secondary);font-size:12.5px">{{ u.email }}</td>
            <td>
              <span class="badge badge-review">{{ u.role?.name ?? '—' }}</span>
            </td>
            <td style="color:var(--color-text-secondary);font-size:12.5px">{{ u.company?.name ?? '—' }}</td>
            <td>
              <span class="badge" :class="u.is_active ? 'badge-approved' : 'badge-rejected'">
                {{ u.is_active ? 'Aktif' : 'Non-aktif' }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:5px">
                <button class="btn btn-secondary btn-sm" @click="openModal(u)">Edit</button>
                <button class="btn btn-secondary btn-sm" @click="openRoleModal(u)">Role</button>
                <button class="btn btn-danger btn-sm" @click="deactivate(u)" v-if="u.is_active && u.id !== authUser?.id">
                  Non-aktifkan
                </button>
                <button class="btn btn-warning btn-sm" @click="resetPassword(u)" v-if="u.id !== authUser?.id">
                  Reset Password
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="display:flex;gap:5px;margin-top:14px;justify-content:flex-end" v-if="meta.last_page > 1">
      <button v-for="p in meta.last_page" :key="p" class="pg-btn" :class="{active:p===meta.current_page}" @click="fetchPage(p)">{{ p }}</button>
    </div>

    <!-- User Modal -->
    <Teleport to="body">
      <div v-if="modal.open" class="modal-overlay" @click.self="modal.open=false">
        <div class="modal">
          <div class="modal-title">{{ modal.id ? 'Edit User' : 'Tambah User Baru' }}</div>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
            <div class="field">
              <label>Nama Lengkap *</label>
              <input v-model="modal.name" type="text" placeholder="e.g. Budi Santoso"/>
            </div>
            <div class="field">
              <label>Email *</label>
              <input v-model="modal.email" type="email" placeholder="budi@perusahaan.com"/>
            </div>
            <div class="field" v-if="!modal.id">
              <label>Password *</label>
              <input v-model="modal.password" type="password" placeholder="Min. 8 karakter"/>
            </div>
            <div>
                <label>Perusahaan *</label>
                <select v-model="modal.company_id" style="width:100%;padding:7px 12px;border:1px solid var(--color-border-tertiary);border-radius:7px;font-size:13px;outline:none">
                  <option value="">Pilih perusahaan...</option>
                  <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div class="field">
              <label>Role *</label>
              <select v-model="modal.role_id">
                <option value="">Pilih role...</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </div>
          </div>
          <div v-if="modal.error" style="margin-top:10px;font-size:12.5px;color:#A32D2D;background:#FCEBEB;padding:8px 12px;border-radius:6px">
            {{ modal.error }}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="modal.open=false">Batal</button>
            <button class="btn btn-primary" :disabled="modal.loading" @click="saveUser">
              <span v-if="modal.loading" class="spinner-sm"/>
              {{ modal.loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Role Modal -->
    <Teleport to="body">
      <div v-if="roleModal.open" class="modal-overlay" @click.self="roleModal.open=false">
        <div class="modal">
          <div class="modal-title">Ubah Role — {{ roleModal.name }}</div>
          <div class="field" style="margin-top:16px">
            <label>Role Baru *</label>
            <select v-model="roleModal.role_id">
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }} ({{ r.slug }})</option>
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="roleModal.open=false">Batal</button>
            <button class="btn btn-primary" :disabled="roleModal.loading" @click="saveRole">
              <span v-if="roleModal.loading" class="spinner-sm"/>
              Simpan
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { companyService, userService } from '@/services'
import { usePermission, useToast } from '@/composables'
import { useAuthStore } from '@/modules/auth/store/authStore'

const { can }    = usePermission()
const { success, error: toastError } = useToast()
const auth       = useAuthStore()
const authUser   = computed(() => auth.user)

const loading     = ref(false)
const items       = ref([])
const roles       = ref([])
const meta        = ref({ current_page:1, last_page:1 })
const activeRole  = ref('')
const activeStatus = ref('')
const search      = ref('')
let _deb = null

const roleFilters = [
  { value:'', label:'Semua Role' },
  { value:'super_admin', label:'Super Admin' },
  { value:'admin', label:'Admin' },
  { value:'inspector', label:'Inspector' },
  { value:'reviewer', label:'Reviewer' },
  { value:'viewer', label:'Viewer' },
]

const roleColorMap = {
  super_admin:'#534AB7', admin:'#185FA5', inspector:'#0F6E56',
  reviewer:'#854F0B', viewer:'#888780',
}

function roleColor(slug) { return roleColorMap[slug] ?? '#888' }
function initials(name='') { return name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() }

// Modals
const modal = ref({ open:false, id:null, name:'', email:'', password:'', role_id:'', loading:false, error:'' })
const roleModal = ref({ open:false, id:null, name:'', role_id:'', loading:false })

function openModal(u=null) {
  modal.value = u
    ? { open:true, id:u.id, name:u.name, email:u.email, password:'', role_id:u.role?.id??'', loading:false, error:'' }
    : { open:true, id:null, name:'', email:'', password:'', role_id:'', loading:false, error:'' }
}

function openRoleModal(u) {
  roleModal.value = { open:true, id:u.id, name:u.name, role_id:u.role?.id??'', loading:false }
}

async function saveUser() {
  if (!modal.value.name || !modal.value.email || !modal.value.role_id) {
    modal.value.error = 'Nama, email, dan role wajib diisi.'
    return
  }
  modal.value.loading = true
  modal.value.error   = ''
  try {
    const payload = { name:modal.value.name, email:modal.value.email, role_id:modal.value.role_id }
    if (!modal.value.id) payload.password = modal.value.password
    if (modal.value.id) await userService.update(modal.value.id, payload)
    else                await userService.create(payload)
    success(modal.value.id ? 'User berhasil diperbarui.' : 'User berhasil ditambahkan.')
    modal.value.open = false
    fetchPage(meta.value.current_page)
  } catch(e) {
    modal.value.error = e.response?.data?.message ?? 'Gagal menyimpan.'
  } finally { modal.value.loading = false }
}

async function saveRole() {
  roleModal.value.loading = true
  try {
    await userService.assignRole(roleModal.value.id, { role_id: roleModal.value.role_id })
    success('Role berhasil diubah.')
    roleModal.value.open = false
    fetchPage(meta.value.current_page)
  } catch { toastError('Gagal mengubah role.') }
  finally { roleModal.value.loading = false }
}

async function deactivate(u) {
  if (!confirm(`Non-aktifkan user ${u.name}?`)) return
  try {
    await userService.delete(u.id)
    success('User berhasil dinonaktifkan.')
    fetchPage(meta.value.current_page)
  } catch(e) { toastError(e.response?.data?.message ?? 'Gagal.') }
}

async function resetPassword(u) {
  if (!confirm(`Reset password user ${u.name}? Password baru akan dikirim ke email.`)) return
  try {
    await userService.resetPassword(u.id)
    success('Password berhasil direset dengan password : kitainspect.')
  } catch(e) { toastError(e.response?.data?.message ?? 'Gagal.') }
}

async function fetchPage(page=1) {
  loading.value = true
  try {
    const params = { page, per_page:15 }
    if (activeRole.value)   params.role       = activeRole.value
    if (activeStatus.value !== '') params.is_active = activeStatus.value
    if (search.value)       params.search     = search.value
    const response = await userService.list(params)
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

async function fetchCompanies() {
    try {
        const  data  = await companyService.list()
        return data.data ?? []  
    } catch {
        return []
    }
}

function setRole(v) { activeRole.value = v; fetchPage(1) }
function debounceFetch() { clearTimeout(_deb); _deb = setTimeout(()=>fetchPage(1), 400) }

onMounted(async () => {
  try {
    const { data } = await userService.roles()
    roles.value = data.roles ?? []
  } catch {}
  fetchPage()
})
</script>

<style scoped>
.filter-btn { padding:6px 14px;border:1px solid var(--color-border-tertiary);border-radius:20px;font-size:12.5px;background:#fff;color:#666;cursor:pointer }
.filter-btn.active { background:#534AB7;color:#fff;border-color:#534AB7 }
.search-wrap input { padding:7px 12px;border:1px solid var(--color-border-tertiary);border-radius:7px;font-size:13px;outline:none;width:220px }
.avatar-sm { width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:600;flex-shrink:0 }
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