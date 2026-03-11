const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
const apiProxyTarget = import.meta.env.VITE_API_PROXY_TARGET?.trim() || 'http://localhost:8080'
const appTitle = import.meta.env.VITE_APP_TITLE?.trim() || 'Sunflower Admin Web'

export const appEnv = {
  apiBaseUrl,
  apiProxyTarget,
  appTitle,
} as const
