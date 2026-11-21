import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findRoute, getHealth } from './api'

describe('API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns JSON for a successful request', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 'ok' }) })
    await expect(getHealth()).resolves.toEqual({ status: 'ok' })
  })

  it('shows backend detail for a 404 response', async () => {
    fetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ detail: 'Unknown node: Atlantis' }) })
    await expect(findRoute('dijkstra', { source: 'Atlantis', destination: 'Delhi' })).rejects.toThrow('Unknown node: Atlantis')
  })

  it('formats validation details from a 422 response', async () => {
    fetch.mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [{ msg: 'Field required' }, { msg: 'Input should be valid' }] }) })
    await expect(getHealth()).rejects.toThrow('Field required, Input should be valid')
  })

  it('reports an unreachable backend on network failure', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(getHealth()).rejects.toThrow(/Backend unreachable.*Check that the backend is running/)
  })
})
