import { apiClient } from './client'

/**
 * Check backend service health and model status.
 * @returns {Promise<{status: string, model_loaded: boolean, version: string, environment: string}>}
 */
export async function checkHealth() {
  return apiClient('/health', { method: 'GET' })
}

/**
 * Submit student habit data to the UNAUTHENTICATED legacy predict endpoint.
 * Kept for backward compatibility. Does NOT save to MongoDB.
 *
 * @param {Object} studentData
 * @returns {Promise<{predicted_mental_health_score: number, score_category: string, status: string}>}
 */
export async function predictMentalHealthScore(studentData) {
  return apiClient('/predict', {
    method: 'POST',
    body: JSON.stringify(studentData),
  })
}

/**
 * Submit a full assessment as an authenticated user.
 * Saves the prediction to MongoDB and returns a record with an ID.
 *
 * @param {Object} studentData — all 12 ML input fields
 * @returns {Promise<{id: string, predicted_mental_health_score: number, score_category: string, created_at: string, status: string}>}
 */
export async function submitAuthenticatedAssessment(studentData) {
  return apiClient('/predictions', {
    method: 'POST',
    body: JSON.stringify(studentData),
  })
}

/**
 * Fetch the authenticated user's prediction history.
 *
 * @param {Object} [params]
 * @param {number} [params.limit=20]
 * @param {number} [params.offset=0]
 * @returns {Promise<{predictions: Array, total: number, limit: number, offset: number}>}
 */
export async function getUserPredictions({ limit = 20, offset = 0 } = {}) {
  return apiClient(`/predictions?limit=${limit}&offset=${offset}`, { method: 'GET' })
}

/**
 * Fetch a single prediction by ID (must belong to the authenticated user).
 *
 * @param {string} predictionId
 * @returns {Promise<PredictionRecord>}
 */
export async function getPredictionById(predictionId) {
  return apiClient(`/predictions/${predictionId}`, { method: 'GET' })
}
