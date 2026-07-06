import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000,
})

// ── Request — inject token ────────────────────────────────────────────────────
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('kita_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response — handle 401 globally ───────────────────────────────────────────
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kita_token');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err)
  },
)

export default http