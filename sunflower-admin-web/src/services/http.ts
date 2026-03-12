import axios from 'axios'
import { appEnv } from '@/config/env'

export const httpClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  timeout: 10000,
})
