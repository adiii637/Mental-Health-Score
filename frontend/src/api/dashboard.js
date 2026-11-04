import { apiClient } from './client'

/**
 * Fetch authenticated user's dashboard summary.
 * Returns latest score, category, delta, trends, insights, and totals.
 * @returns {Promise<Object>}
 */
export async function getDashboardSummary() {
  return apiClient('/dashboard/summary', {
    method: 'GET',
  })
}
