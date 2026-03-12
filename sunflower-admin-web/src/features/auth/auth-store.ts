import { useSyncExternalStore } from 'react'

const ADMIN_TOKEN_STORAGE_KEY = 'sunflower.admin.token'

type Listener = () => void

const listeners = new Set<Listener>()
let cachedSnapshot: AdminAuthSnapshot = {
  token: '',
  isAuthenticated: false,
}

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function readStoredToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim() ?? ''
}

function writeStoredToken(token: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (token && token.trim()) {
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token.trim())
  } else {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  }

  notifyListeners()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === ADMIN_TOKEN_STORAGE_KEY) {
      notifyListeners()
    }
  })
}

export interface AdminAuthSnapshot {
  token: string
  isAuthenticated: boolean
}

export function getAdminToken() {
  return readStoredToken()
}

export function setAdminToken(token: string) {
  writeStoredToken(token)
}

export function clearAdminToken() {
  writeStoredToken(null)
}

export function getAdminAuthSnapshot(): AdminAuthSnapshot {
  const token = readStoredToken()

  if (cachedSnapshot.token === token) {
    return cachedSnapshot
  }

  cachedSnapshot = {
    token,
    isAuthenticated: token.length > 0,
  }

  return cachedSnapshot
}

export function subscribeAdminAuth(listener: Listener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function useAdminAuth() {
  return useSyncExternalStore(subscribeAdminAuth, getAdminAuthSnapshot, getAdminAuthSnapshot)
}
