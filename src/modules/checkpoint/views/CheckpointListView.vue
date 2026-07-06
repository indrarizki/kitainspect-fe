<template>
    <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
            <div>
                <h1 style="font-size:16px;font-weight:500">Manajemen Checkpoint</h1>
                <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Kelola data checkpoint</p>
            </div>
            <button v-if="can('checkpoint.create')" class="btn btn-primary" @click="openModal()">+ Tambah Checkpoint</button>
        </div>

        <div class="table-wrap">
            <div v-if="loading" class="loading-ph">Memuat...</div>
            <div v-else-if="!items.length" class="empty-ph">Tidak ada checkpoint ditemukan.</div>
            <table v-else>
                <thead>
                    <tr>
                        <th>Nama Checkpoint</th>
                        <th>Kode</th>
                        <th>Deskripsi</th>
                        <th>Dibuat</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="c in items" :key="c.id">
                        <td>{{ c.name }}</td>
                        <td style="font-family:var(--font-mono);font-size:12.5px;background:var(--color-background-secondary);padding:2px 8px;border-radius:4px">{{ c.code }}</td>
                        <td>{{ c.description }}</td>    
                        <td>{{ formatDate(c.created_at) }}</td>
                        <td>
                            <button class="btn btn-sm btn-secondary" @click="editItem(c)">Edit</button>
                            <button class="btn btn-sm btn-danger" @click="deleteItem(c)">Hapus</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style="display:flex;gap:5px;margin-top:14px;justify-content:flex-end" v-if="meta.last_page > 1">
            <button v-for="p in meta.last_page" :key="p" class="pg-btn" :class="{active: p===meta.current_page}" @click="fetchPage(p)">{{ p }}</button>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { checkpointService } from '@/services'
import { usePermission } from '@/composables'

const { can }     = usePermission()
const loading     = ref(false)
const items       = ref([])
const meta        = ref({ current_page: 1, last_page: 1 })
let _deb = null

async function fetchPage(page = 1) {
    loading.value = true
    try {
        const res = await checkpointService.list({ page })
        console.log(res.data);
        
        items.value = res.data
        meta.value = res.meta
    } catch (error) {
        console.error('Error fetching checkpoints:', error)
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