/**
 * API client configuration and utility wrapper.
 *
 * Automatically includes JWT Authorization header if stored in localStorage.
 * Defaults to relative '/api/v1' to leverage Vite proxy in development.
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE_URL = RAW_BASE ? RAW_BASE.replace(/\/$/, '') : ''
const API_PREFIX = '/api/v1'

export const TOKEN_STORAGE_KEY = 'mentalwell_access_token'

export async function apiClient(endpoint, options = {}) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL}${API_PREFIX}${normalizedEndpoint}`

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  }

  // Attach Bearer token if present and not already specified
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(url, config)

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`

      if (data && typeof data === 'object') {
        if (typeof data.detail === 'string') {
          message = data.detail
        } else if (Array.isArray(data.detail)) {
          // Pydantic validation error array
          message = data.detail.map((err) => `${err.loc?.slice(-1)[0] || 'field'}: ${err.msg}`).join(', ')
        } else if (data.message) {
          message = data.message
        }
      }

      const error = new Error(message)
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      const netError = new Error('Unable to connect to backend server. Please ensure the backend is running on port 8000.')
      netError.status = 0
      throw netError
    }
    throw err
  }
}
