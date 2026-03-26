import { useSyncExternalStore } from 'react'

const ADMIN_SESSION_STORAGE_KEY = 'sunflower.admin.session'
const LEGACY_ADMIN_TOKEN_STORAGE_KEY = 'sunflower.admin.token'

type Listener = () => void

const listeners = new Set<Listener>()
let bootstrapping = false

export interface AdminAuthSnapshot {
  token: string
  account: AdminAccountProfile | null
  isAuthenticated: boolean
  isBootstrapping: boolean
}

let cachedSnapshot: AdminAuthSnapshot = {
  token: '',
  account: null,
  isAuthenticated: false,
  isBootstrapping: false,
}

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export interface AdminAccountProfile {
  id: string
  phone: string
  role: string
  roleLabel: string
}

interface StoredAdminSession {
  token: string
  account: AdminAccountProfile | null
}

function isSameAccount(left: AdminAccountProfile | null, right: AdminAccountProfile | null) {
  if (left === right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  return (
    left.id === right.id &&
    left.phone === right.phone &&
    left.role === right.role &&
    left.roleLabel === right.roleLabel
  )
}

function normalizeToken(token: unknown) {
  return typeof token === 'string' ? token.trim() : ''
}

function normalizeAccount(account: unknown): AdminAccountProfile | null {
  if (!account || typeof account !== 'object') {
    return null
  }

  const rawAccount = account as Partial<AdminAccountProfile>
  const id = typeof rawAccount.id === 'string' ? rawAccount.id.trim() : ''
  const phone = typeof rawAccount.phone === 'string' ? rawAccount.phone.trim() : ''
  const role = typeof rawAccount.role === 'string' ? rawAccount.role.trim() : ''
  const roleLabel = typeof rawAccount.roleLabel === 'string' ? rawAccount.roleLabel.trim() : ''

  if (!id || !phone || !role) {
    return null
  }

  return {
    id,
    phone,
    role,
    roleLabel,
  }
}

function readStoredSession(): StoredAdminSession {
  if (typeof window === 'undefined') {
    return {
      token: '',
      account: null,
    }
  }

  const rawValue = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
  if (!rawValue) {
    return {
      token: '',
      account: null,
    }
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<StoredAdminSession>
    const token = normalizeToken(parsedValue.token)
    if (!token) {
      return {
        token: '',
        account: null,
      }
    }

    return {
      token,
      account: normalizeAccount(parsedValue.account),
    }
  } catch {
    return {
      token: '',
      account: null,
    }
  }
}

function buildSnapshot(session: StoredAdminSession): AdminAuthSnapshot {
  if (
    cachedSnapshot.token === session.token &&
    cachedSnapshot.isBootstrapping === bootstrapping &&
    isSameAccount(cachedSnapshot.account, session.account)
  ) {
    return cachedSnapshot
  }

  cachedSnapshot = {
    token: session.token,
    account: session.account,
    isAuthenticated: session.token.length > 0,
    isBootstrapping: bootstrapping,
  }

  return cachedSnapshot
}

function writeStoredSession(session: StoredAdminSession | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (session?.token) {
    window.localStorage.setItem(
      ADMIN_SESSION_STORAGE_KEY,
      JSON.stringify({
        token: session.token,
        account: session.account,
      }),
    )
  } else {
    window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
  }
  window.localStorage.removeItem(LEGACY_ADMIN_TOKEN_STORAGE_KEY)
  buildSnapshot(
    session ?? {
      token: '',
      account: null,
    },
  )

  notifyListeners()
}

function readSnapshot(): AdminAuthSnapshot {
  return buildSnapshot(readStoredSession())
}

if (typeof window !== 'undefined') {
  window.localStorage.removeItem(LEGACY_ADMIN_TOKEN_STORAGE_KEY)
  const initialSession = readStoredSession()
  bootstrapping = initialSession.token.length > 0
  buildSnapshot(initialSession)

  window.addEventListener('storage', (event) => {
    if (event.key === ADMIN_SESSION_STORAGE_KEY || event.key === LEGACY_ADMIN_TOKEN_STORAGE_KEY) {
      const nextSession = readStoredSession()
      bootstrapping = nextSession.token.length > 0
      buildSnapshot(nextSession)
      notifyListeners()
    }
  })
}

export function getAdminToken() {
  return readStoredSession().token
}

export function getAdminAccount() {
  return readStoredSession().account
}

export function setAdminSession(session: StoredAdminSession) {
  bootstrapping = false
  writeStoredSession({
    token: normalizeToken(session.token),
    account: normalizeAccount(session.account),
  })
}

export function updateAdminAccount(account: AdminAccountProfile | null) {
  const session = readStoredSession()
  if (!session.token) {
    return
  }

  bootstrapping = false
  writeStoredSession({
    token: session.token,
    account: normalizeAccount(account),
  })
}

export function clearAdminSession() {
  bootstrapping = false
  writeStoredSession(null)
}

export function setAdminBootstrapping(nextBootstrapping: boolean) {
  bootstrapping = nextBootstrapping
  buildSnapshot(readStoredSession())
  notifyListeners()
}

export function getAdminAuthSnapshot(): AdminAuthSnapshot {
  return readSnapshot()
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
