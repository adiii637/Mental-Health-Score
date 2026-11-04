import { apiClient, TOKEN_STORAGE_KEY } from './client'

/**
 * Register a new user account.
 * @param {Object} payload
 * @param {string} payload.name
 * @param {string} payload.email
 * @param {string} payload.password
 * @returns {Promise<{id: string, name: string, email: string, created_at: string}>}
 */
export async function registerUser({ name, email, password }) {
  return apiClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

/**
 * Authenticate user with credentials.
 * @param {Object} payload
 * @param {string} payload.email
 * @param {string} payload.password
 * @returns {Promise<{access_token: string, token_type: string, expires_in: number, user: Object}>}
 */
export async function loginUser({ email, password }) {
  return apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/**
 * Fetch authenticated user profile using stored JWT token.
 * @returns {Promise<{id: string, name: string, email: string, created_at: string, updated_at?: string}>}
 */
export async function getCurrentUser() {
  return apiClient('/auth/me', {
    method: 'GET',
  })
}

/**
 * Update user's name on their profile.
 * @param {Object} payload
 * @param {string} payload.name
 * @returns {Promise<{id: string, name: string, email: string, created_at: string, updated_at?: string}>}
 */
export async function updateUserProfile({ name }) {
  return apiClient('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}
