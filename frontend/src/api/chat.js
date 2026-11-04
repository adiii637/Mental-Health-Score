import { apiClient } from './client'

/**
 * Send a message to the AI Wellness Companion.
 *
 * @param {Object} payload
 * @param {string} payload.message - The text message sent by the user (1-5000 chars)
 * @param {string} [payload.sessionId] - Optional session ID to continue an ongoing conversation
 * @returns {Promise<{session_id: string, title: string, user_message: Object, assistant_message: Object, created_at: string, updated_at: string}>}
 */
export async function sendChatMessage({ message, sessionId }) {
  return apiClient('/chat/message', {
    method: 'POST',
    body: JSON.stringify({
      message,
      session_id: sessionId || null,
    }),
  })
}

/**
 * Retrieve paginated list of chat sessions owned by the authenticated user.
 *
 * @param {Object} [params]
 * @param {number} [params.limit=20]
 * @param {number} [params.offset=0]
 * @returns {Promise<{sessions: Array, total: number, limit: number, offset: number}>}
 */
export async function getChatSessions({ limit = 20, offset = 0 } = {}) {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  }).toString()

  return apiClient(`/chat/sessions?${query}`, {
    method: 'GET',
  })
}

/**
 * Retrieve a single chat session including full message history.
 *
 * @param {string} sessionId
 * @returns {Promise<{id: string, title: string, messages: Array, created_at: string, updated_at: string}>}
 */
export async function getChatSession(sessionId) {
  return apiClient(`/chat/sessions/${sessionId}`, {
    method: 'GET',
  })
}

/**
 * Permanently delete a chat session owned by the authenticated user.
 *
 * @param {string} sessionId
 * @returns {Promise<{message: string, id: string}>}
 */
export async function deleteChatSession(sessionId) {
  return apiClient(`/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  })
}
