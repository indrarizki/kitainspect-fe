<template>
    <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
            <div>
                <h1 style="font-size:16px;font-weight:500">Manajemen Employee</h1>
                <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Kelola data employee</p>
            </div>
            <div>
                <button v-if="can('employee.create')" class="btn btn-primary" @click="$router.push('/employees/create')">+ Tambah Employee</button>
                <span>&nbsp;</span>
                <button class="btn btn-secondary" @click="openUploadModal()">Import Employee</button>
            </div>
        </div>

        <div class="table-wrap">
            <div v-if="loading" class="loading-ph">Memuat...</div>
            <div v-else-if="!items.length" class="empty-ph">Tidak ada employee ditemukan.</div>
            <table v-else>
                <thead>
                <tr>
                    <th>Employee ID</th>
                    <th>Full Name</th>
                    <th>Status</th>
                    <th>Aksi</th>
                </tr>
                </thead>
                <tbody>
                    <tr v-for="c in items" :key="c.id">
                        <td>
                            <div style="display:flex;align-items:center;gap:10px">
                                <div class="company-avatar">
                                {{ c.fullName.charAt(0).toUpperCase() }}
                                </div>
                                <div>
                                <div style="font-weight:500">{{ c.code }}</div>
                                </div>
                            </div>
                        </td>
                        <td style="font-weight:500">{{ c.fullName }}</td>
                        <td >
                            <span class="badge" :class="{ 'badge-success': c.employeeStatus === 'A', 'badge-danger': c.employeeStatus === 'I' }">
                                {{ c.employeeStatus === 'A' ? 'Active' : 'Inactive' }}
                            </span>
                        </td>
                        <td>
                            <div style="display:flex;gap:5px">
                                <button class="btn btn-secondary btn-sm" @click="$router.push(`/employees/${c.id}`)">Edit</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div style="display:flex;gap:5px;margin-top:14px;justify-content:flex-end" v-if="meta.last_page > 1">
            <button v-for="p in meta.last_page" :key="p" class="pg-btn" :class="{active:p===meta.current_page}" @click="fetchPage(p)">{{ p }}</button>
        </div>
    </div>
  <div v-if="showAddModal" class="modal-overlay">
            <div class="modal">
                <div class="modal-title">Tambah Employee</div>
                <div style="margin-top:12px">
                    <label>Employee ID</label>
                    <input v-model="form.code" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px" />
                    <label style="margin-top:10px;display:block">Full Name</label>
                    <input v-model="form.fullName" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px" />
                    <label style="margin-top:10px;display:block">Status</label>
                    <select v-model="form.status" style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--color-border-tertiary);border-radius:6px">
                        <option value="A">Active</option>
                        <option value="I">Inactive</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="closeAddModal">Batal</button>
                    <button class="btn btn-primary" :disabled="savingAdd" @click="submitAdd">
                        <span v-if="savingAdd" class="spinner-sm"></span>
                        <span v-if="!savingAdd">Simpan</span>
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showUploadModal" class="modal-overlay">
            <div class="modal">
                <div class="modal-title">Upload Employee</div>
                <div style="margin-top:12px">
                    <p style="font-size:13px;color:var(--color-text-tertiary);margin-bottom:6px">Pilih file CSV atau Excel berisi data employee.</p>
                    <input type="file" ref="fileInput" @change="onFileChange" accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" />
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
import { ref, onMounted } from 'vue'
import { employeeService } from '@/services'
import { usePermission } from '@/composables'
import http from '@/services/http'

const { can }   = usePermission()

const items   = ref([])
const loading = ref(false)
const meta    = ref({ current_page:1, last_page:1 })

const showAddModal = ref(false)
const showUploadModal = ref(false)
const savingAdd = ref(false)
const uploading = ref(false)

const form = ref({ code: '', fullName: '', status: 'active' })
const fileInput = ref(null)
const selectedFile = ref(null)

const fetchPage = async (page=1) => {
    loading.value = true
    try {
        const params = { page, per_page: 15 }
        const response = await employeeService.list(params)
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

function openModal() { showAddModal.value = true }
function closeAddModal() { showAddModal.value = false; form.value = { code:'', fullName:'', status:'active' } }
function openUploadModal() { showUploadModal.value = true }
function closeUploadModal() { showUploadModal.value = false; selectedFile.value = null; if (fileInput.value) fileInput.value.value = null }

async function submitAdd() {
    if (!form.value.code || !form.value.fullName) return alert('Isi semua field')
    savingAdd.value = true
    try {
        await employeeService.create({ code: form.value.code, fullName: form.value.fullName, status: form.value.status })
        alert('Employee berhasil ditambahkan')
        closeAddModal()
        fetchPage()
    } catch (e) {
        console.error(e)
        alert('Gagal menambahkan employee')
    } finally {
        savingAdd.value = false
    }
}

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
        // POST ke endpoint import; sesuaikan jika backend berbeda
        await http.post('/employees/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        alert('Upload berhasil')
        closeUploadModal()
        fetchPage()
    } catch (e) {
        console.error(e)
        alert('Gagal meng-upload file')
    } finally {
        uploading.value = false
    }
}

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