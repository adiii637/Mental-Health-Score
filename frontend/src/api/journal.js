import { apiClient } from './client'

/**
 * Create a new private journal entry.
 * @param {Object} payload
 * @param {string} payload.mood - 'strained' | 'balanced' | 'strong'
 * @param {string} payload.content - reflection content
 * @param {string} [payload.title] - optional title
 * @returns {Promise<Object>}
 */
export async function createJournalEntry({ mood, content, title }) {
  return apiClient('/journals', {
    method: 'POST',
    body: JSON.stringify({ mood, content, title }),
  })
}

/**
 * Fetch paginated list of journal entries for authenticated user.
 * @param {Object} [params]
 * @param {number} [params.limit=20]
 * @param {number} [params.offset=0]
 * @returns {Promise<{journals: Array, total: number, limit: number, offset: number}>}
 */
export async function getJournalEntries({ limit = 20, offset = 0 } = {}) {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  }).toString()
  return apiClient(`/journals?${query}`, {
    method: 'GET',
  })
}

/**
 * Fetch a single journal entry by ID.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getJournalEntryById(id) {
  return apiClient(`/journals/${id}`, {
    method: 'GET',
  })
}

/**
 * Update an existing journal entry.
 * @param {string} id
 * @param {Object} payload
 * @param {string} [payload.mood]
 * @param {string} [payload.content]
 * @param {string} [payload.title]
 * @returns {Promise<Object>}
 */
export async function updateJournalEntry(id, { mood, content, title }) {
  return apiClient(`/journals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ mood, content, title }),
  })
}

/**
 * Delete a journal entry.
 * @param {string} id
 * @returns {Promise<{message: string, id: string}>}
 */
export async function deleteJournalEntry(id) {
  return apiClient(`/journals/${id}`, {
    method: 'DELETE',
  })
}
