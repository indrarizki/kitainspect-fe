<template>
  <div class="page">
    <!-- Left: Form -->
    <div class="left">
      <div class="logo">
        <div class="logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
        </div>
        <span class="logo-text">kita<span>INSPECT</span></span>
      </div>

      <div class="form-wrap">
        <h1 class="form-title">Selamat datang</h1>
        <p class="form-sub">Masuk ke akun kitaINSPECT Anda</p>

        <!-- Global error -->
        <div v-if="globalError" class="alert-error">{{ globalError }}</div>

        <div class="field" :class="{ error: errors.email }">
          <label>Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="nama@perusahaan.com"
            @keydown.enter="handleLogin"
            autocomplete="email"
          />
          <span class="field-error" v-if="errors.email">{{ errors.email[0] }}</span>
        </div>

        <div class="field" :class="{ error: errors.password }">
          <label>Password</label>
          <div class="input-wrap">
            <input
              v-model="form.password"
              :type="showPw ? 'text' : 'password'"
              placeholder="••••••••"
              @keydown.enter="handleLogin"
              autocomplete="current-password"
            />
            <button type="button" class="pw-toggle" @click="showPw = !showPw">
              {{ showPw ? '🙈' : '👁' }}
            </button>
          </div>
          <span class="field-error" v-if="errors.password">{{ errors.password[0] }}</span>
        </div>

        <button class="btn-login" :disabled="auth.loading" @click="handleLogin">
          <span v-if="auth.loading" class="spinner" />
          {{ auth.loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </div>
    </div>

    <!-- Right: Feature highlights -->
    <div class="right">
      <div class="right-inner">
        <h2 class="right-title">Kelola inspeksi dengan mudah</h2>

        <div v-for="f in features" :key="f.title" class="feature">
          <div class="feat-icon" :style="`background:${f.bg}`">
            <span>{{ f.emoji }}</span>
          </div>
          <div>
            <div class="feat-title">{{ f.title }}</div>
            <div class="feat-desc">{{ f.desc }}</div>
          </div>
        </div>

        <div class="status-pill">
          <span class="dot" />
          Sistem online &mdash; v1.0.0
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store/authStore'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const form = reactive({ email: '', password: '' })
const errors      = ref({})
const globalError = ref('')
const showPw      = ref(false)

const features = [
  { emoji: '📋', bg: '#EEEDFE', title: 'Form builder dinamis', desc: 'Buat template inspeksi kustom tanpa coding' },
  { emoji: '✅', bg: '#E1F5EE', title: 'Approval workflow berjenjang', desc: 'Reviewer QC → Admin dengan notifikasi real-time' },
  { emoji: '📊', bg: '#FAECE7', title: 'Dashboard & laporan', desc: 'Export PDF dan Excel, pantau semua inspeksi' },
]

async function handleLogin() {
  errors.value      = {}
  globalError.value = ''

  if (!form.email)    { errors.value.email    = ['Email wajib diisi.']; return }
  if (!form.password) { errors.value.password = ['Password wajib diisi.']; return }

  const result = await auth.login(form.email, form.password)

  if (result.ok) {
    const redirect = route.query.redirect ?? '/dashboard'
    router.push(redirect)
  } else {
    errors.value      = result.errors
    globalError.value = Object.keys(result.errors).length === 0 ? result.message : ''
  }
}
</script>

<style scoped>
.page { min-height: 100vh; display: flex; }
.left { width: 420px; flex-shrink: 0; background: #fff; border-right: 0.5px solid #e0dfd8; display: flex; flex-direction: column; padding: 36px 44px; }
.right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; background: #f5f4f0; }
.logo { display: flex; align-items: center; gap: 10px; margin-bottom: auto; }
.logo-icon { width: 34px; height: 34px; background: #534AB7; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.logo-text { font-size: 16px; font-weight: 500; color: #1a1a18; }
.logo-text span { color: #534AB7; }
.form-wrap { flex: 1; display: flex; flex-direction: column; justify-content: center; max-width: 320px; width: 100%; padding: 32px 0; }
.form-title { font-size: 22px; font-weight: 500; color: #1a1a18; margin-bottom: 5px; }
.form-sub { font-size: 13px; color: #888; margin-bottom: 28px; }
.alert-error { background: #FCEBEB; color: #791F1F; padding: 10px 14px; border-radius: 7px; font-size: 13px; margin-bottom: 16px; border: 1px solid #F5BABA; }
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 12px; font-weight: 500; color: #555; margin-bottom: 5px; }
.field input { width: 100%; padding: 9px 12px; border: 1px solid #d8d7cf; border-radius: 7px; font-size: 13.5px; color: #1a1a18; outline: none; transition: border-color .15s; }
.field input:focus { border-color: #534AB7; box-shadow: 0 0 0 3px rgba(83,74,183,.1); }
.field.error input { border-color: #E24B4A; }
.field-error { font-size: 11.5px; color: #A32D2D; margin-top: 4px; display: block; }
.input-wrap { position: relative; }
.input-wrap input { padding-right: 36px; }
.pw-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 14px; }
.btn-login { width: 100%; padding: 10px; background: #534AB7; color: #fff; border: none; border-radius: 7px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; transition: opacity .15s; }
.btn-login:hover:not(:disabled) { background: #4540a0; }
.btn-login:disabled { opacity: .65; }
.spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

.right-inner { max-width: 340px; }
.right-title { font-size: 18px; font-weight: 500; color: #1a1a18; margin-bottom: 24px; }
.feature { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
.feat-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.feat-title { font-size: 13px; font-weight: 500; color: #1a1a18; }
.feat-desc { font-size: 12px; color: #888; margin-top: 2px; }
.status-pill { display: inline-flex; align-items: center; gap: 7px; background: #fff; border: 1px solid #e0dfd8; border-radius: 20px; padding: 6px 14px; font-size: 12px; color: #666; margin-top: 12px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #1D9E75; flex-shrink: 0; }
</style>