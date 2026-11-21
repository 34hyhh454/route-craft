import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import Dashboard from './Dashboard'
import { findRoute, getGraph, getHistory } from '../services/api'

vi.mock('../services/api', () => ({
  findRoute: vi.fn(),
  getGraph: vi.fn(),
  getHistory: vi.fn(),
  compareAlgorithms: vi.fn(),
  addFavorite: vi.fn(),
}))
vi.mock('../components/RouteMap', () => ({ default: () => <div aria-label="Map" /> }))
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    splitTextToSize: vi.fn((text) => text),
    text: vi.fn(),
    save: vi.fn(),
  })),
}))

describe('Dashboard route form validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getGraph.mockResolvedValue({ nodes: { Delhi: { lat: 28.6, lon: 77.2 }, Shimla: { lat: 31.1, lon: 77.1 } }, edges: [] })
    getHistory.mockResolvedValue([])
  })

  it('requires both a start and a destination', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await screen.findAllByRole('option', { name: 'Shimla' })
    fireEvent.click(screen.getByRole('button', { name: /Find Optimal Route/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose both a start and a destination.')
    expect(findRoute).not.toHaveBeenCalled()
  })

  it('rejects the same start and destination', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await screen.findAllByRole('option', { name: 'Shimla' })
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: 'Delhi' } })
    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Delhi' } })
    fireEvent.click(screen.getByRole('button', { name: /Find Optimal Route/ }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Start and destination must be different.'))
    expect(findRoute).not.toHaveBeenCalled()
  })

  it('exports a PDF for a found route', async () => {
    findRoute.mockResolvedValue({
      algorithm: 'dijkstra',
      found: true,
      path: ['Delhi', 'Shimla'],
      distance_km: 108,
      time_h: 2,
      nodes_explored: 4,
      exec_ms: 0.02,
    })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await screen.findAllByRole('option', { name: 'Shimla' })
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: 'Delhi' } })
    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Shimla' } })
    fireEvent.click(screen.getByRole('button', { name: /Find Optimal Route/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Export route summary as PDF/ }))
    await waitFor(() => expect(jsPDF).toHaveBeenCalledOnce())
  })
})
