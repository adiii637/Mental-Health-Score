/**
 * Community API — Peer Support Community endpoints.
 */
import { apiClient } from './client'

// -------------------------------------------------------------------------
// Posts
// -------------------------------------------------------------------------

/**
 * Fetch paginated community posts.
 * @param {object} params
 * @param {string|null} params.category  - category name or null/undefined for all
 * @param {number}      params.limit
 * @param {number}      params.offset
 * @param {boolean}     params.myPosts   - if true, only return own posts
 */
export async function getPosts({ category = null, limit = 20, offset = 0, myPosts = false } = {}) {
  const qs = new URLSearchParams()
  if (category && category !== 'All') qs.set('category', category)
  qs.set('limit', String(limit))
  qs.set('offset', String(offset))
  if (myPosts) qs.set('my_posts', 'true')

  return apiClient(`/community/posts?${qs.toString()}`)
}

/**
 * Create a new community post.
 * @param {{ content: string, category: string, is_anonymous: boolean }} data
 */
export async function createPost(data) {
  return apiClient('/community/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Delete a post by ID.
 * @param {string} postId
 */
export async function deletePost(postId) {
  return apiClient(`/community/posts/${postId}`, { method: 'DELETE' })
}

// -------------------------------------------------------------------------
// Comments
// -------------------------------------------------------------------------

/**
 * Fetch all comments for a post.
 * @param {string} postId
 */
export async function getComments(postId) {
  return apiClient(`/community/posts/${postId}/comments`)
}

/**
 * Create a comment on a post.
 * @param {string} postId
 * @param {{ content: string, is_anonymous: boolean }} data
 */
export async function createComment(postId, data) {
  return apiClient(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Delete a comment by ID.
 * @param {string} commentId
 */
export async function deleteComment(commentId) {
  return apiClient(`/community/comments/${commentId}`, { method: 'DELETE' })
}

// -------------------------------------------------------------------------
// Support reactions
// -------------------------------------------------------------------------

/**
 * Toggle support on a post.
 * @param {string} postId
 */
export async function toggleSupport(postId) {
  return apiClient(`/community/posts/${postId}/support`, { method: 'POST' })
}
