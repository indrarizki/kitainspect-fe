<template>
    <div v-if="loading" class="loading-ph">Memuat List Authorization...</div>
    <div v-else-if="!roleData" class="empty-ph">List Authorization tidak ditemukan.</div>
    <div v-else>
      <div class="edit-role-page">
        <header class="header">
          <div class="breadcrumb-container">
            <span class="breadcrumb-item">Roles</span>
            <span class="breadcrumb-separator">></span>
            <span class="breadcrumb-item active">Edit role</span>
          </div>
        </header>
    
        <!-- Main Card Container -->
        <main class="main-card">
          
          <!-- Bagian 1: Input Detail Peran -->
          <section class="role-inputs">
            <div class="input-group">
              <label for="roleName">Name </label>
              <input id="roleName" type="text" v-model="roleData.name" />
            </div>
            <div class="input-group">
              <label for="roleDescription">Description</label>
              <input id="roleDescription" type="text" v-model="roleData.description" />
            </div>
            <!-- <div class="input-group">
              <label for="roleLevel">Role level</label>
              <div class="select-wrapper">
                <select id="roleLevel" v-model="roleData.level">
                  <option value="10">10</option>
                  <option value="9">9</option>
                </select>
                <span class="select-arrow">&#x25BC;</span>
              </div>
            </div> -->
          </section>
    
          <!-- Bagian 2: Daftar Izin Dikelompokkan -->
          <div class="tree-container">
            <div class="tree-header-wrapper">
              <h3 class="tree-title">Hak Akses (Permission)</h3>
              <p class="tree-subtitle">Atur izin modul dengan mencentang item di bawah ini.</p>
            </div>
            
            <div class="permission-tree">
              <div 
                v-for="(permissions, moduleName) in groupedPermissions" 
                :key="moduleName" 
                class="tree-node"
              >
                <div class="tree-row parent-row" :class="{ 'is-expanded': openedModules[moduleName] }">
                  <div class="tree-left" @click="toggleModuleCollapse(moduleName)">
                    <span class="tree-arrow" :class="{ 'is-open': openedModules[moduleName] }">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                    <span class="folder-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    </span>
                    <span class="module-name">{{ moduleName }}</span>
                    <span class="badge-count">{{ permissions.length }} Izin</span>
                  </div>
                  
                  <div class="tree-right">
                    <label class="checkbox-container select-all-label">
                      <input 
                        type="checkbox" 
                        class="custom-checkbox"
                        :checked="isAllCheckedInGroup(moduleName)" 
                        :indeterminate="isIndeterminateInGroup(moduleName)"
                        @change="toggleAllForGroup(moduleName, $event)" 
                      />
                      <span class="checkbox-text">Pilih Semua</span>
                    </label>
                  </div>
                </div>

                <transition name="tree-slide">
                  <div v-show="openedModules[moduleName]" class="tree-children-wrapper">
                    <ul class="tree-children">
                      <li 
                        v-for="(permission, index) in permissions" 
                        :key="permission.id" 
                        class="tree-row child-row"
                      >
                        <span class="tree-line-vertical"></span>
                        <span v-if="index === permissions.length - 1" class="tree-line-mask"></span>

                        <div class="tree-left">
                          <span class="file-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                          </span>
                          <label :for="permission.id" class="permission-label">
                            <span class="permission-name">{{ permission.name }}</span>
                            <span class="slug-text">{{ permission.slug }}</span>
                          </label>
                        </div>
                        
                        <div class="tree-right">
                          <input 
                            type="checkbox" 
                            :id="permission.id" 
                            :value="permission.id" 
                            class="custom-checkbox"
                            v-model="currentRolePermissionIds" 
                          />
                        </div>
                      </li>
                    </ul>
                  </div>
                </transition>
              </div>
            </div>
          </div>
    
        </main>
        <div style="padding:16px;border-top:1px solid #e0dfd8;text-align:right">
          <button class="btn btn-secondary" @click="$router.push('/roles')" style="margin-right:8px">Batal</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveRole">
            {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { roleService, permissionService } from '@/services'
import { useToast } from '@/composables'

const route = useRoute()
const { success, error: toastError } = useToast()

interface Permission {
  id: string
  name: string
  slug: string
  module: string
  created_at: string | null
  updated_at: string | null
}

const loading        = ref(true)
const saving         = ref(false)
const allPermissions = ref<Permission[]>([])
const roleData       = ref<any>(null)

// ── Ini yang penting — sync dari role.permissions ──────────────────────────
const currentRolePermissionIds = ref<string[]>([])

// ── openedModules harus didefinisikan ─────────────────────────────────────
const openedModules = ref<Record<string, boolean>>({})

// ── Grouped permissions by module ─────────────────────────────────────────
const groupedPermissions = computed(() => {
  return allPermissions.value.reduce((acc, permission) => {
    const key = permission.module || 'Uncategorized'
    if (!acc[key]) acc[key] = []
    acc[key].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)
})

function setIndeterminate(el: any, moduleName: string) {
  if (el) el.indeterminate = isIndeterminateInGroup(moduleName)
}

function toggleModuleCollapse(moduleName: string) {
  openedModules.value[moduleName] = !openedModules.value[moduleName]
}

function isAllCheckedInGroup(moduleName: string): boolean {
  const group = groupedPermissions.value[moduleName]
  if (!group?.length) return false
  return group.every(p => currentRolePermissionIds.value.includes(p.id))
}

// ── isIndeterminateInGroup — ini yang kurang ──────────────────────────────
function isIndeterminateInGroup(moduleName: string): boolean {
  const group = groupedPermissions.value[moduleName]
  if (!group?.length) return false
  const checkedCount = group.filter(p => currentRolePermissionIds.value.includes(p.id)).length
  return checkedCount > 0 && checkedCount < group.length
}

function toggleAllForGroup(moduleName: string, event: Event) {
  const isChecked = (event.target as HTMLInputElement).checked
  const groupIds  = groupedPermissions.value[moduleName].map(p => p.id)
  if (isChecked) {
    currentRolePermissionIds.value = [...new Set([...currentRolePermissionIds.value, ...groupIds])]
  } else {
    currentRolePermissionIds.value = currentRolePermissionIds.value.filter(id => !groupIds.includes(id))
  }
}

// ── Fetch all permissions ──────────────────────────────────────────────────
async function fetchPermissions() {
  try {
    const response = await permissionService.list()
    
    // PERBAIKAN: Tambahkan .permissions di belakang response.data
    if (response.data && response.data.permissions) {
      allPermissions.value = response.data.permissions
    } else {
      allPermissions.value = [] // Fallback jika data kosong
    }

    console.log('Data permissions berhasil dimuat:', allPermissions.value);
    
    // Sekarang proses map ini dijamin aman dan berjalan lancar
    const modules = [...new Set(allPermissions.value.map(p => p.module))]
    modules.forEach(m => { 
      if (m) openedModules.value[m] = true 
    })

  } catch (e) {
    console.error('Gagal memuat permissions:', e)
  }
}

// ── Fetch role + sync permissions ─────────────────────────────────────────
async function fetchPage() {
  loading.value = true
  try {
    const response = await roleService.get(route.params.id)
    roleData.value = response.data.role

    // ← INI yang penting: sync permission IDs dari role ke checkbox
    currentRolePermissionIds.value = roleData.value.permissions?.map(
      (p: Permission) => p.id
    ) ?? []

  } catch (e) {
    console.error('Gagal memuat data:', e)
    toastError('Gagal memuat data role.')
  } finally {
    loading.value = false
  }
}

// ── Save role + permissions ───────────────────────────────────────────────
async function saveRole() {
  saving.value = true
  
  try {
    await permissionService.update(route.params.id, {
      permission_id: currentRolePermissionIds.value,
      role_id: route.params.id,

    })
    success('Role berhasil disimpan.')
  } catch (e) {
    toastError('Gagal menyimpan role.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchPage(), fetchPermissions()])
})
</script>

<style scoped>
.tree-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  max-width: full;
  margin: 20px auto;
}

.tree-header-wrapper {
  margin-bottom: 20px;
}

.tree-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.tree-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* Wrapper Utama Tree */
.permission-tree {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
}

.tree-node {
  border-bottom: 1px solid #e2e8f0;
}

.tree-node:last-child {
  border-bottom: none;
}

/* Base Row (Baris) */
.tree-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: #ffffff;
  transition: all 0.2s ease;
}

/* Baris Grup / Modul */
.parent-row {
  background-color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.parent-row:hover {
  background-color: #f1f5f9;
}

.parent-row.is-expanded {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

/* Struktur Kiri & Kanan */
.tree-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0; /* Mencegah flexbox overflow */
}

.tree-right {
  display: flex;
  align-items: center;
  padding-left: 15px;
}

/* Animasi & Gaya Panah */
.tree-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s fill;
  color: #64748b;
}

.tree-arrow.is-open {
  transform: rotate(90deg);
  color: #1e293b;
}

/* Nama Modul & Badge */
.module-name {
  color: #0f172a;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-count {
  font-size: 11px;
  background: #e0e7ff;
  color: #4338ca;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
}

/* Elemen Anak / Item Izin */
.tree-children-wrapper {
  background: #ffffff;
}

.tree-children {
  list-style: none;
  padding: 0;
  margin: 0;
}

.child-row {
  padding-left: 52px;
  position: relative;
  border-bottom: 1px dashed #f1f5f9;
}

.child-row:last-child {
  border-bottom: none;
}

.child-row:hover {
  background-color: #f8fafc;
}

/* Garis Struktur Pohon Visual (Tree Lines) */
.tree-line-vertical {
  position: absolute;
  left: 26px;
  top: 0;
  height: 100%;
  width: 1.5px;
  background-color: #cbd5e1;
}

/* Untuk memotong garis vertikal di item terakhir */
.tree-line-mask {
  position: absolute;
  left: 26px;
  top: 50%;
  height: 50%;
  width: 2px;
  background-color: #ffffff;
}

/* Modifikasi teks Izin */
.permission-label {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.permission-name {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.slug-text {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
  margin-top: 1px;
}

/* Styling Checkbox Modern */
.custom-checkbox {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  outline: none;
  background-color: #fff;
  cursor: pointer;
  display: grid;
  place-content: center;
  transition: all 0.15s ease;
}

.custom-checkbox:hover {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.custom-checkbox:checked {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

.custom-checkbox:checked::before {
  content: "";
  width: 10px;
  height: 6px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg) translate(1px, -1px);
}

/* Efek khusus untuk status Indeterminate (Garis Strip Tengah) */
.custom-checkbox:indeterminate {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

.custom-checkbox:indeterminate::before {
  content: "";
  width: 10px;
  height: 2px;
  background-color: #fff;
}

/* Label Teks Pilihan Semua */
.select-all-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
}

.select-all-label:hover {
  color: #4f46e5;
}

/* Animasi Transisi Slide Smooth */
.tree-slide-enter-active, .tree-slide-leave-active {
  transition: max-height 0.25s ease-in-out, opacity 0.2s ease;
  max-height: 800px;
  overflow: hidden;
}
.tree-slide-enter-from, .tree-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.edit-role-page {
  font-family: Arial, sans-serif;
  color: #333;
  padding: 2rem;
  background-color: #f5f7fa; /* Latar belakang halaman abu-abu muda */
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.breadcrumb-container {
  display: flex;
  align-items: center;
  color: #4a5568;
}

.breadcrumb-item.active {
  color: #1a202c;
  font-weight: 600;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  color: #a0aec0;
}

.translate-button {
  padding: 0.5rem 1.5rem;
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

/* Main Card */
.main-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Role Inputs */
.role-inputs {
  padding: 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.input-group {
  display: flex;
  margin-bottom: 1rem;
}

.input-group label {
  width: 150px;
  color: #4a5568;
}

.input-group input,
.select-wrapper select {
  flex-grow: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #1a202c;
}

.input-group input:focus,
.select-wrapper select:focus {
  outline: none;
  border-color: #a0aec0;
}

/* Dropdown */
.select-wrapper {
  position: relative;
  flex-grow: 1;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #a0aec0;
  font-size: 0.8rem;
}

/* Permission Groups */
.permission-groups {
  padding: 2rem;
}

.permission-group-card {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  margin-bottom: 2rem;
  overflow: hidden;
}

.permission-group-card:last-child {
  margin-bottom: 0;
}

/* Group Header (Baris Header) */
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.group-title {
  margin: 0;
  font-weight: 600;
}

.group-header input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}

/* Permission List */
.permission-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-label {
  flex-grow: 1;
  cursor: pointer;
  color: #4a5568;
}

.permission-item input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}
</style>