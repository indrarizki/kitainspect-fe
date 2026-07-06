<template>
    <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
            <div>
                <h1 style="font-size:16px;font-weight:500">Manajemen Role</h1>
                <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Kelola data role</p>
            </div>
            <button class="btn btn-primary" @click="openModal()">+ Tambah Role</button>
        </div>

        <div class="table-wrap">
            <div v-if="loading" class="loading-ph">Memuat...</div>
            <div v-else-if="!items.length" class="empty-ph">Tidak ada role ditemukan.</div>
            <table v-else>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
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
                                </div>
                            </div>
                        </td>
                        <td style="font-weight:500">{{ c.description }}</td>
                        <td>
                            <div style="display:flex;gap:5px">
                                <button class="btn btn-secondary btn-sm" @click="$router.push(`/roles/${c.id}`)">Edit</button>
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { roleService } from '@/services'
import { usePermission } from '@/composables' 

const { can }   = usePermission()
// const { success, error: toastError } = useToast()

const items   = ref([])
const loading = ref(false)
const meta    = ref({ current_page:1, last_page:1 })

const fetchPage = async (page=1) => {
    loading.value = true
    try {
        const params = { page, per_page: 15 }
        const response = await roleService.list(params)
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