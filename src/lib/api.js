import axios from 'axios'
import { getToken, clearToken } from './auth'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://asimos-backend.onrender.com'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
