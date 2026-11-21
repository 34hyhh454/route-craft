import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Heart, RefreshCw, Trash2 } from 'lucide-react'
import { Badge, Button, EmptyState, SkeletonBlock, Toast } from '../components/UI'
import useRequest from '../hooks/useRequest'
import { deleteFavorite, getFavorites } from '../services/api'

export default function Favorites() {
  const navigate = useNavigate()
  const loadFavorites = useCallback(() => getFavorites(), [])
  const { data, loading, error, refresh } = useRequest(loadFavorites)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const remove = async () => {
    if (!pendingDelete) return
    const item = pendingDelete
    setActionError('')
    setActionMessage('')
    setDeleting(item.id)
    try {
      await deleteFavorite(item.id)
      setPendingDelete(null)
      await refresh()
      setActionMessage('Favorite removed.')
    } catch (err) {
      setActionError(err.message)
    } finally {
      setDeleting(null)
    }
  }
  const openRoute = (item) => navigate('/', { state: { source: item.source, destination: item.destination, weight: item.weight } })

  return (
    <div className="content-page page-enter">
      <header className="page-heading">
        <div><p className="eyebrow">Saved for later</p><h1>Favorites</h1><p>Your saved source and destination pairs.</p></div>
        <Button onClick={refresh}><RefreshCw size={16} /> Refresh</Button>
      </header>
      {actionError && !pendingDelete && <Toast kind="error">{actionError}</Toast>}
      {actionMessage && <Toast kind="success">{actionMessage}</Toast>}
      <section className="panel data-panel favorites-panel">
        {loading ? <div className="data-loading"><SkeletonBlock rows={4} /></div>
          : error ? <div className="data-message"><Toast kind="error">{error}</Toast><Button className="retry-button" onClick={refresh}>Retry</Button></div>
            : data?.length ? <div className="table-scroll"><table className="data-table favorites-table">
              <thead><tr>{['Favorite', 'Route', 'Mode', 'Actions'].map((label) => <th key={label}>{label}</th>)}</tr></thead>
              <tbody>{data.map((item) => (
                <tr key={item.id}>
                  <td><div className="favorite-title"><span className="favorite-icon"><Heart size={15} /></span><span>{item.name}</span></div></td>
                  <td><div className="history-route">{item.source}<span>→</span>{item.destination}</div></td>
                  <td><Badge>{item.weight}</Badge></td>
                  <td><div className="favorite-row-actions">
                    <Button variant="primary" className="table-action" onClick={() => openRoute(item)}>Open route <ArrowUpRight size={14} /></Button>
                    <Button className="icon-action danger-action" aria-label={`Delete ${item.name}`} title={`Delete ${item.name}`} onClick={() => setPendingDelete(item)} disabled={deleting === item.id}><Trash2 size={16} /></Button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table></div>
              : <EmptyState icon={Heart} title="Nothing saved yet">Save a route from the dashboard to keep it close at hand.</EmptyState>}
      </section>

      {pendingDelete && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setPendingDelete(null) }}>
        <section className="confirm-dialog panel" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
          <span className="confirm-icon"><Trash2 size={20} /></span>
          <h2 id="delete-title">Remove favorite?</h2>
          <p id="delete-description">“{pendingDelete.name}” will be removed from your saved routes.</p>
          {actionError && <Toast kind="error">{actionError}</Toast>}
          <div className="dialog-actions">
            <Button onClick={() => setPendingDelete(null)} disabled={Boolean(deleting)}>Cancel</Button>
            <Button variant="primary" className="confirm-delete" onClick={remove} disabled={Boolean(deleting)}>{deleting ? 'Removing…' : 'Remove favorite'}</Button>
          </div>
        </section>
      </div>}
    </div>
  )
}
