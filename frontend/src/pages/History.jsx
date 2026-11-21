import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock3, RotateCcw, Search } from 'lucide-react'
import { Badge, Button, EmptyState, Select, SkeletonBlock, Toast } from '../components/UI'
import useRequest from '../hooks/useRequest'
import { getHistory } from '../services/api'
import { RESULT_LABEL } from '../utils/format'

const algorithmColor = {
  dijkstra: 'var(--route-dijkstra)',
  astar: 'var(--route-astar)',
  bfs: 'var(--route-bfs)',
  dfs: 'var(--route-dfs)',
}

function relativeTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  const elapsed = Math.max(0, Date.now() - date.getTime())
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function History() {
  const navigate = useNavigate()
  const loadHistory = useCallback(() => getHistory(200), [])
  const { data, loading, error, refresh } = useRequest(loadHistory)
  const [algorithm, setAlgorithm] = useState('all')
  const [found, setFound] = useState('all')
  const rows = useMemo(() => (data || []).filter((row) =>
    (algorithm === 'all' || row.algorithm === algorithm) &&
    (found === 'all' || String(row.found) === found),
  ), [data, algorithm, found])
  const rerun = (row) => navigate('/', { state: { source: row.source, destination: row.destination, weight: row.weight, algorithm: row.algorithm } })

  return (
    <div className="content-page page-enter">
      <header className="page-heading">
        <div><p className="eyebrow">Your activity</p><h1>Search history</h1><p>Routes returned and persisted by your backend.</p></div>
        <Button onClick={refresh} aria-label="Refresh history"><RotateCcw size={16} /> Refresh</Button>
      </header>
      <p className="page-source-label">{RESULT_LABEL}</p>

      <section className="panel data-panel">
        <div className="table-toolbar">
          <div className="table-count"><Clock3 size={16} /><span>{loading ? 'Loading searches' : `${rows.length} ${rows.length === 1 ? 'search' : 'searches'}`}</span></div>
          <div className="filter-group">
            <label>Algorithm<Select aria-label="Filter by algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
              <option value="all">All algorithms</option>{['dijkstra', 'astar', 'bfs', 'dfs'].map((item) => <option key={item} value={item}>{item}</option>)}
            </Select></label>
            <label>Status<Select aria-label="Filter by path status" value={found} onChange={(e) => setFound(e.target.value)}>
              <option value="all">All results</option><option value="true">Path found</option><option value="false">No path</option>
            </Select></label>
          </div>
        </div>
        {loading ? <div className="data-loading"><SkeletonBlock rows={5} /></div>
          : error ? <div className="data-message"><Toast kind="error">{error}</Toast><Button className="retry-button" onClick={refresh}>Retry</Button></div>
            : rows.length === 0 ? <EmptyState icon={Search} title={data?.length ? 'No matching searches' : 'No searches yet'}>{data?.length ? 'Adjust the filters to see more results.' : 'Completed route searches will appear here.'}</EmptyState>
              : <div className="table-scroll"><table className="data-table">
                <thead><tr>{['Route', 'Algorithm', 'Mode', 'Status', 'Distance', 'Nodes', 'Date', ''].map((label) => <th key={label}>{label}</th>)}</tr></thead>
                <tbody>{rows.map((row) => (
                  <tr key={row.id}>
                    <td><div className="history-route">{row.source}<span>→</span>{row.destination}</div></td>
                    <td><Badge className="algorithm-badge" style={{ '--algorithm-color': algorithmColor[row.algorithm] || 'var(--muted)' }}>{row.algorithm}</Badge></td>
                    <td className="capitalize">{row.weight}</td>
                    <td><Badge tone={row.found ? 'success' : 'warning'}><span className="status-small-dot" />{row.found ? 'Found' : 'Not found'}</Badge></td>
                    <td className="mono">{row.distance_km == null ? '—' : `${row.distance_km} km`}</td>
                    <td className="mono">{row.nodes_explored}</td>
                    <td title={row.created_at ? new Date(row.created_at).toLocaleString() : ''} className="date-cell">{relativeTime(row.created_at)}</td>
                    <td><Button className="table-action" onClick={() => rerun(row)}>Re-run</Button></td>
                  </tr>
                ))}</tbody>
              </table></div>}
      </section>
    </div>
  )
}
