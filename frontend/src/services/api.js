const DEFAULT_API_BASE = import.meta.env.PROD ? window.location.origin : 'http://127.0.0.1:8000'
const API_BASE = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).replace(/\/$/, '')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    throw new Error(`Backend unreachable at ${API_BASE}. Check that the backend is running.`)
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body.detail) detail = Array.isArray(body.detail) ? body.detail.map((item) => item.msg).join(', ') : body.detail
    } catch {
      detail = `Request failed (${response.status})`
    }
    throw new Error(String(detail))
  }
  if (response.status === 204) return null
  return response.json()
}

const json = (body) => ({ method: 'POST', body: JSON.stringify(body) })

export const getHealth = () => request('/api/health')
export const getGraph = () => request('/api/graph')
export const findRoute = (algorithm, body) => request(`/api/algorithms/${algorithm}`, json(body))
export const compareAlgorithms = (body) => request('/api/algorithms/compare', json(body))
export const getHistory = (limit = 50) => request(`/api/history?limit=${encodeURIComponent(limit)}`)
export const getFavorites = () => request('/api/favorites')
export const addFavorite = (body) => request('/api/favorites', json(body))
export const deleteFavorite = (id) => request(`/api/favorites/${encodeURIComponent(id)}`, { method: 'DELETE' })
