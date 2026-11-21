import { useCallback, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Activity, ArrowDownToLine, ArrowLeftRight, Clock3, Heart, LoaderCircle, MapPin, RotateCcw, Search, Waypoints } from 'lucide-react'
import RouteMap from '../components/RouteMap'
import { Badge, Button, EmptyState, Input, Select, SkeletonBlock, StatTile, Toast } from '../components/UI'
import useRequest from '../hooks/useRequest'
import { addFavorite, compareAlgorithms, findRoute, getGraph, getHistory } from '../services/api'
import { formatDuration, RESULT_LABEL } from '../utils/format'

const algorithmColor = {
  dijkstra: 'var(--route-dijkstra)',
  astar: 'var(--route-astar)',
  bfs: 'var(--route-bfs)',
  dfs: 'var(--route-dfs)',
}

export default function Dashboard() {
  const location = useLocation()
  const loadGraph = useCallback(() => getGraph(), [])
  const loadRecent = useCallback(() => getHistory(5), [])
  const graphState = useRequest(loadGraph)
  const recentState = useRequest(loadRecent)
  const cities = useMemo(() => Object.keys(graphState.data?.nodes || {}), [graphState.data])
  const [source, setSource] = useState(() => location.state?.source || '')
  const [destination, setDestination] = useState(() => location.state?.destination || '')
  const [weight, setWeight] = useState(() => location.state?.weight || 'distance')
  const [algorithm, setAlgorithm] = useState(() =>
    ['dijkstra', 'astar'].includes(location.state?.algorithm) ? location.state.algorithm : 'dijkstra',
  )
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [comparison, setComparison] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState('')
  const [favoriteName, setFavoriteName] = useState('')
  const [favoriteMessage, setFavoriteMessage] = useState('')
  const [pdfError, setPdfError] = useState('')

  const search = async (event) => {
    event.preventDefault()
    setError('')
    if (!source || !destination) { setError('Choose both a start and a destination.'); return }
    if (source === destination) { setError('Start and destination must be different.'); return }
    setLoading(true)
    try {
      const result = await findRoute(algorithm, { source, destination, weight })
      setRoute(result)
      setComparison(null)
      await recentState.refresh()
    } catch (err) {
      setError(err.message)
      setRoute(null)
    } finally {
      setLoading(false)
    }
  }

  const swap = () => { setSource(destination); setDestination(source) }
  const clear = () => { setRoute(null); setError('') }
  const compare = async () => {
    setCompareError('')
    setCompareLoading(true)
    if (!source || !destination) {
      setCompareError('Choose both a start and a destination before comparing.')
      setCompareLoading(false)
      return
    }
    if (source === destination) {
      setCompareError('Start and destination must be different.')
      setCompareLoading(false)
      return
    }
    try {
      const response = await compareAlgorithms({ source, destination, weight })
      setComparison(response.results)
      setRoute(null)
      await recentState.refresh()
    } catch (err) {
      setCompareError(err.message)
    } finally {
      setCompareLoading(false)
    }
  }
  const chooseComparison = (result) => setRoute(result)
  const saveFavorite = async (event) => {
    event.preventDefault()
    setFavoriteMessage('')
    if (!route?.found) return
    try {
      await addFavorite({ name: favoriteName.trim(), source, destination, weight })
      setFavoriteName('')
      setFavoriteMessage('Favorite saved.')
    } catch (err) {
      setFavoriteMessage(err.message)
    }
  }
  const exportPdf = async () => {
    setPdfError('')
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF()
      const pathText = route?.path?.length ? route.path.join(' -> ') : 'No path found'
      const lines = [
        'Route Craft — Route Summary',
        `Source: ${source}`,
        `Destination: ${destination}`,
        `Mode: ${weight === 'distance' ? 'Shortest distance' : 'Fastest time'}`,
        `Algorithm: ${route.algorithm}`,
        `Path: ${pathText}`,
        `Distance: ${route.distance_km == null ? '—' : `${route.distance_km} km`}`,
        `Time: ${formatDuration(route.time_h)}`,
        `Nodes explored: ${route.nodes_explored}`,
        `Execution time: ${Number(route.exec_ms).toFixed(3)} ms`,
        `Date: ${new Date().toLocaleString()}`,
        'Computed by custom graph algorithm on built-in offline dataset',
      ]
      const wrapped = pdf.splitTextToSize(lines.join('\n'), 180)
      pdf.text(wrapped, 15, 20)
      pdf.save(`route-${source}-${destination}.pdf`.replace(/[^a-z0-9._-]/gi, '-'))
    } catch (err) {
      setPdfError(`PDF export failed: ${err.message}`)
    }
  }
  const refill = (item) => {
    setSource(item.source)
    setDestination(item.destination)
    setWeight(item.weight)
    setAlgorithm(['dijkstra', 'astar'].includes(item.algorithm) ? item.algorithm : 'dijkstra')
    setRoute(null)
  }

  const selectedColor = route ? algorithmColor[route.algorithm] || 'var(--route-final)' : 'var(--route-final)'
  const minDistance = comparison?.length ? Math.min(...comparison.filter((row) => row.distance_km != null).map((row) => row.distance_km)) : Infinity
  const minNodes = comparison?.length ? Math.min(...comparison.map((row) => row.nodes_explored)) : Infinity

  return (
    <div className="dashboard-page page-enter">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Route Craft · Route workspace</p>
          <h1>Intelligent routes, <span className="gradient-text">clearly explored.</span></h1>
          <p className="dashboard-tagline">Intelligent Route Optimization and Pathfinding System</p>
        </div>
        <Badge className="dataset-badge"><span className="badge-dot" />{RESULT_LABEL}</Badge>
      </header>

      <section className="dashboard-map-stage" aria-label="Route planning workspace">
        <RouteMap graph={graphState.data} route={route} routeColor={selectedColor} source={source} destination={destination} className="dashboard-map" />

        <section className="planner-float glass-panel">
          <div className="planner-heading">
            <span className="planner-heading-icon"><Waypoints size={18} /></span>
            <div><h2>Plan a route</h2><p>Choose your journey</p></div>
          </div>
          {graphState.loading && <SkeletonBlock rows={4} />}
          {graphState.error && <div className="form-notice"><Toast kind="error">{graphState.error}</Toast><button className="text-link" onClick={graphState.refresh}>Retry loading graph</button></div>}
          {!graphState.loading && !graphState.error && (
            <form className="planner-form" onSubmit={search} noValidate>
              <label className="planner-field">Start
                <span className="select-with-marker"><i className="field-marker start-marker" /><Select aria-label="Start" value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="">Select a city</option>{cities.map((city) => <option key={city}>{city}</option>)}
                </Select></span>
              </label>
              <div className="swap-row">
                <span className="route-connector" aria-hidden="true" />
                <Button type="button" className="swap-button" onClick={swap} aria-label="Swap start and destination" title="Swap locations"><ArrowLeftRight size={15} /> Swap</Button>
              </div>
              <label className="planner-field">Destination
                <span className="select-with-marker"><i className="field-marker destination-marker" /><Select aria-label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)}>
                  <option value="">Select a city</option>{cities.map((city) => <option key={city}>{city}</option>)}
                </Select></span>
              </label>

              <div className="planner-segments">
                <fieldset>
                  <legend>Optimize for</legend>
                  <div className="segment-control" aria-label="Route optimization mode">
                    <button type="button" className={weight === 'distance' ? 'segment active' : 'segment'} aria-pressed={weight === 'distance'} onClick={() => setWeight('distance')}>Distance</button>
                    <button type="button" className={weight === 'time' ? 'segment active' : 'segment'} aria-pressed={weight === 'time'} onClick={() => setWeight('time')}>Time</button>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Algorithm</legend>
                  <div className="segment-control algorithm-segments" aria-label="Route algorithm">
                    <button type="button" className={algorithm === 'dijkstra' ? 'segment active' : 'segment'} aria-pressed={algorithm === 'dijkstra'} onClick={() => setAlgorithm('dijkstra')}>Dijkstra</button>
                    <button type="button" className={algorithm === 'astar' ? 'segment active' : 'segment'} aria-pressed={algorithm === 'astar'} onClick={() => setAlgorithm('astar')}>A*</button>
                  </div>
                </fieldset>
              </div>
              {error && <Toast kind="error">{error}</Toast>}
              <Button variant="primary" className="find-route-button" type="submit" disabled={loading || !cities.length}>
                {loading ? <><LoaderCircle size={17} className="animate-spin" /> Finding route…</> : <><Search size={17} /> Find Optimal Route</>}
              </Button>
              <Button className="compare-button" type="button" onClick={compare} disabled={compareLoading || !cities.length}>
                {compareLoading ? <><LoaderCircle size={16} className="animate-spin" /> Comparing…</> : <><Activity size={16} /> Compare algorithms</>}
              </Button>
              {compareError && <Toast kind="error">{compareError}</Toast>}
            </form>
          )}
          {route && <Button className="clear-route-button" onClick={clear}><RotateCcw size={15} /> Clear route</Button>}
        </section>

        {(route || comparison) && (
          <div className="dashboard-right-stack">
            {route && (
              <section className="results-float glass-panel">
                <div className="results-heading">
                  <div><p className="eyebrow">Route result</p><h2>{source || route.path?.[0]} <span>→</span> {destination || route.path?.at(-1)}</h2></div>
                  <Badge className="algorithm-badge" style={{ '--algorithm-color': algorithmColor[route.algorithm] || 'var(--route-final)' }}>{route.algorithm}</Badge>
                </div>
                {!route.found ? <Toast kind="info">No path was found between these nodes.</Toast> : (
                  <>
                    <div className="results-stats">
                      <StatTile label="Distance" value={route.distance_km == null ? '—' : `${route.distance_km} km`} icon={MapPin} />
                      <StatTile label="Estimated time" value={formatDuration(route.time_h)} icon={Clock3} />
                      <StatTile label="Nodes explored" value={route.nodes_explored} icon={Waypoints} />
                      <StatTile label="Execution time" value={`${Number(route.exec_ms).toFixed(3)} ms`} icon={Activity} />
                    </div>
                    <div className="timeline-section">
                      <div className="section-title-row"><h3>Route timeline</h3><span>{route.path.length} stops</span></div>
                      <ol className="route-timeline">{route.path.map((stop, index) => {
                        const next = route.path[index + 1]
                        const leg = next && graphState.data?.edges.find((edge) => (edge.u === stop && edge.v === next) || (edge.v === stop && edge.u === next))
                        return (
                          <li key={`${stop}-${index}`} className={index === 0 || index === route.path.length - 1 ? 'timeline-stop endpoint' : 'timeline-stop'}>
                            <span className="timeline-marker" aria-hidden="true" />
                            <span className="timeline-name">{stop}</span>
                            {leg && <span className="timeline-leg">{leg.km} km <span>to {next}</span></span>}
                          </li>
                        )
                      })}</ol>
                    </div>
                  </>
                )}
                {route.found && <form className="favorite-inline" onSubmit={saveFavorite}>
                  <label htmlFor="favorite-name">Save this route</label>
                  <div className="favorite-actions"><Input id="favorite-name" aria-label="Favorite name" maxLength="120" required value={favoriteName} onChange={(e) => setFavoriteName(e.target.value)} placeholder="Favorite name" /><Button type="submit" aria-label="Save favorite"><Heart size={16} /></Button></div>
                  {favoriteMessage && <Toast kind={favoriteMessage === 'Favorite saved.' ? 'success' : 'error'}>{favoriteMessage}</Toast>}
                </form>}
                <Button className="export-button" type="button" onClick={exportPdf}><ArrowDownToLine size={15} /> Export route summary as PDF</Button>
                {pdfError && <Toast kind="error">{pdfError}</Toast>}
                <p className="result-source">{RESULT_LABEL}</p>
              </section>
            )}

            {comparison && <section className="compare-float glass-panel">
              <div className="compare-header"><div><p className="eyebrow">Side-by-side</p><h2>Compare algorithms</h2></div><Badge>{comparison.length} results</Badge></div>
              <p className="compare-description">{RESULT_LABEL} · Select a row to display its route.</p>
              <div className="compare-table-wrap">
                <table className="compare-table">
                  <thead><tr>{['Algorithm', 'Distance', 'Nodes', 'Exec ms'].map((title) => <th key={title}>{title}</th>)}</tr></thead>
                  <tbody>{comparison.map((item) => (
                    <tr key={item.algorithm} onClick={() => chooseComparison(item)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') chooseComparison(item) }} aria-label={`Show ${item.algorithm} route`}>
                      <td><Badge className="algorithm-badge" style={{ '--algorithm-color': algorithmColor[item.algorithm] || 'var(--muted)' }}>{item.algorithm}</Badge>{item.distance_km === minDistance && <span className="best-label">BEST</span>}</td>
                      <td className={item.distance_km === minDistance ? 'best-value mono' : 'mono'}>{item.distance_km == null ? '—' : `${item.distance_km} km`}</td>
                      <td className={item.nodes_explored === minNodes ? 'best-value mono' : 'mono'}>{item.nodes_explored}</td>
                      <td className="mono">{Number(item.exec_ms).toFixed(3)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="compare-note">BFS optimizes the number of hops and DFS finds a path through depth-first exploration; neither is a weighted shortest-path algorithm.</p>
            </section>}
          </div>
        )}
      </section>

      <section className="recent-section">
        <div className="recent-heading"><div><p className="eyebrow">Pick up where you left off</p><h2>Recent searches</h2></div><Button className="refresh-recent" onClick={recentState.refresh} aria-label="Refresh recent searches"><RotateCcw size={15} /></Button></div>
        <p className="recent-source">{RESULT_LABEL}</p>
        {recentState.loading ? <SkeletonBlock rows={2} />
          : recentState.error ? <div className="recent-error"><Toast kind="error">{recentState.error}</Toast><button className="text-link" onClick={recentState.refresh}>Retry</button></div>
            : recentState.data?.length ? <div className="recent-chips">{recentState.data.map((item) => (
              <button key={item.id} className="recent-chip" onClick={() => refill(item)}>
                <span className="recent-route">{item.source}<span>→</span>{item.destination}</span>
                <span className="recent-meta">{item.algorithm} · {item.weight}</span>
                <span className="recent-use">Use route</span>
              </button>
            ))}</div>
              : <EmptyState icon={Search} title="No searches yet">Plan a route and your recent searches will appear here.</EmptyState>}
      </section>
    </div>
  )
}
