import { useCallback, useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Pause, Play, RotateCcw, Waypoints } from 'lucide-react'
import { Badge, Button, Select, SkeletonBlock, Tabs, Toast } from '../components/UI'
import useRequest from '../hooks/useRequest'
import { findRoute, getGraph } from '../services/api'
import { RESULT_LABEL } from '../utils/format'

const colors = { unvisited: '#8B95B5', exploring: '#FBBF24', visited: '#818CF8', path: '#34D399' }
const emptyNodes = Object.freeze({})
const emptyEdges = Object.freeze([])
const algorithmSteps = {
  dijkstra: [
    ['01', 'Select', 'Expand the node with the smallest known cost.'],
    ['02', 'Relax', 'Update neighboring costs when a cheaper route is found.'],
    ['03', 'Complete', 'Stop when the destination is reached.'],
  ],
  astar: [
    ['01', 'Estimate', 'Add the heuristic distance to the known route cost.'],
    ['02', 'Prioritize', 'Expand the candidate with the lowest estimated total.'],
    ['03', 'Complete', 'Use the destination path returned by the backend.'],
  ],
}

export default function AlgorithmVisualizer() {
  const loadGraph = useCallback(() => getGraph(), [])
  const graphState = useRequest(loadGraph)
  const nodes = graphState.data?.nodes || emptyNodes
  const edges = graphState.data?.edges || emptyEdges
  const cityNames = useMemo(() => Object.keys(nodes), [nodes])
  const extents = useMemo(() => {
    const points = Object.values(nodes)
    if (!points.length) return null
    return {
      minLat: Math.min(...points.map((point) => point.lat)), maxLat: Math.max(...points.map((point) => point.lat)),
      minLon: Math.min(...points.map((point) => point.lon)), maxLon: Math.max(...points.map((point) => point.lon)),
    }
  }, [nodes])
  const [algorithm, setAlgorithm] = useState('dijkstra')
  const [selectedSource, setSelectedSource] = useState('')
  const [selectedDestination, setSelectedDestination] = useState('')
  const [weight, setWeight] = useState('distance')
  const [speed, setSpeed] = useState(5)
  const [result, setResult] = useState(null)
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const source = selectedSource || cityNames[0] || ''
  const destination = selectedDestination || cityNames.at(-1) || ''

  useEffect(() => {
    if (!playing || !result) return undefined
    const timer = window.setInterval(() => {
      setStep((current) => {
        const next = current + 1
        if (next >= result.visited_order.length - 1) setPlaying(false)
        return Math.min(next, result.visited_order.length - 1)
      })
    }, Math.max(75, 1200 / speed))
    return () => window.clearInterval(timer)
  }, [playing, result, speed])

  const start = async () => {
    setError('')
    if (!source || !destination) { setError('Choose a source and destination.'); return }
    if (source === destination) { setError('Source and destination must be different.'); return }
    setLoading(true)
    setPlaying(false)
    try {
      const data = await findRoute(algorithm, { source, destination, weight })
      setResult(data)
      setStep(-1)
      setPlaying(data.visited_order.length > 0)
    } catch (err) {
      setError(err.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }
  const reset = () => { setPlaying(false); setStep(-1) }
  const resume = () => {
    if (result && result.visited_order.length) {
      if (step >= result.visited_order.length - 1) setStep(-1)
      setPlaying(true)
    }
  }
  const positionOf = (name) => {
    const point = nodes[name]
    if (!point || !extents) return [0, 0]
    const width = Math.max(extents.maxLon - extents.minLon, 0.001)
    const height = Math.max(extents.maxLat - extents.minLat, 0.001)
    return [75 + ((point.lon - extents.minLon) / width) * 650, 54 + ((extents.maxLat - point.lat) / height) * 330]
  }
  const pathNodes = new Set(step >= (result?.visited_order.length ?? Infinity) - 1 ? result?.path || [] : [])
  const visited = new Set(result?.visited_order.slice(0, step + 1) || [])
  const current = result?.visited_order[step]
  const stateOf = (name) => pathNodes.has(name) ? 'path' : name === current ? 'exploring' : visited.has(name) ? 'visited' : 'unvisited'
  const exploredCount = result ? Math.max(step + 1, 0) : 0

  return (
    <div className="content-page visualizer-page page-enter">
      <header className="page-heading visualizer-heading">
        <div><p className="eyebrow">Algorithm lab</p><h1>Pathfinding visualizer</h1><p>Animate the actual node exploration returned by the backend.</p></div>
        <Badge><span className="badge-dot" /> Live graph data</Badge>
      </header>

      <div className="visualizer-layout">
        <section className="panel visualizer-main">
          <div className="visualizer-filters">
            <label>Algorithm<Select aria-label="Algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}><option value="dijkstra">Dijkstra</option><option value="astar">A*</option></Select></label>
            <label>Source<Select aria-label="Source" value={source} onChange={(e) => setSelectedSource(e.target.value)}>{cityNames.map((name) => <option key={name}>{name}</option>)}</Select></label>
            <label>Destination<Select aria-label="Destination" value={destination} onChange={(e) => setSelectedDestination(e.target.value)}>{cityNames.map((name) => <option key={name}>{name}</option>)}</Select></label>
            <label>Mode<Select aria-label="Mode" value={weight} onChange={(e) => setWeight(e.target.value)}><option value="distance">Shortest distance</option><option value="time">Fastest time</option></Select></label>
            <Button variant="primary" className="visualizer-start" onClick={start} disabled={loading || graphState.loading}>{loading ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={16} />}{loading ? 'Starting…' : 'Start search'}</Button>
          </div>
          {graphState.loading && <div className="visualizer-loading"><SkeletonBlock rows={5} /></div>}
          {graphState.error && <div className="visualizer-message"><Toast kind="error">{graphState.error}</Toast><Button onClick={graphState.refresh}>Retry</Button></div>}
          {error && <Toast kind="error">{error}</Toast>}

          {!graphState.loading && !graphState.error && (
            <div className="visualizer-canvas-wrap">
              <div className="canvas-caption"><span><Waypoints size={15} /> GRAPH EXPLORATION</span><span>{cityNames.length} nodes <i /> {edges.length} connections</span></div>
              <svg viewBox="0 0 800 440" className="visualizer-canvas" role="img" aria-label="Graph and current algorithm exploration">
                <defs>
                  <pattern id="visualizer-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" className="grid-stroke" strokeWidth="1" /></pattern>
                  <filter id="node-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <rect width="800" height="440" fill="url(#visualizer-grid)" />
                {edges.map((edge, index) => {
                  if (!nodes[edge.u] || !nodes[edge.v]) return null
                  const [x1, y1] = positionOf(edge.u), [x2, y2] = positionOf(edge.v)
                  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2
                  return <g key={`${edge.u}-${edge.v}-${index}`} className="visualizer-edge">
                    <line x1={x1} y1={y1} x2={x2} y2={y2} />
                    <rect x={midX - 20} y={midY - 17} width="40" height="15" rx="5" className="edge-label-bg" />
                    <text x={midX} y={midY - 6} textAnchor="middle">{edge.km} km</text>
                  </g>
                })}
                {cityNames.map((name) => {
                  const [x, y] = positionOf(name)
                  const nodeState = stateOf(name)
                  const endpoint = name === source || name === destination
                  return <g key={name} className={`visualizer-node node-${nodeState}`}>
                    <circle className="node-halo" cx={x} cy={y} r={name === current ? 19 : 15} />
                    <circle className="node-circle" cx={x} cy={y} r={endpoint ? 9 : 7} filter={name === current ? 'url(#node-glow)' : undefined} />
                    <text className={`node-label${endpoint ? ' endpoint-label' : ''}`} x={x} y={y + 27} textAnchor="middle">{name}</text>
                    {name === source && <text className="node-tag" x={x} y={y - 19} textAnchor="middle">START</text>}
                    {name === destination && <text className="node-tag" x={x} y={y - 19} textAnchor="middle">END</text>}
                  </g>
                })}
              </svg>
              <div className="canvas-legend">{Object.entries(colors).map(([label, color]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</div>
            </div>
          )}

          <div className="visualizer-controlbar">
            <div className="playback-buttons">
              <Button className="control-icon-button" aria-label={playing ? 'Pause visualization' : 'Play visualization'} title={playing ? 'Pause' : 'Play'} onClick={() => playing ? setPlaying(false) : resume()} disabled={!result || loading}>{playing ? <Pause size={17} /> : <Play size={17} />}</Button>
              <Button className="control-icon-button" aria-label="Reset visualization" title="Reset" onClick={reset} disabled={!result}><RotateCcw size={16} /></Button>
            </div>
            <label className="speed-control"><span>Speed</span><input aria-label="Animation speed" type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} /><span className="mono">{speed}×</span></label>
            <div className="step-counter"><span>STEP</span><strong className="mono">{result ? `${exploredCount} / ${result.visited_order.length}` : '—'}</strong></div>
          </div>
          {result && <div className="visualizer-result">
            <span>{RESULT_LABEL}</span>
            <strong><span className="mono">{exploredCount}</span> of <span className="mono">{result.nodes_explored}</span> explored</strong>
            {!result.found && <Badge tone="warning">No path found</Badge>}
          </div>}
        </section>

        <aside className="visualizer-aside">
          <section className="panel explanation-panel">
            <div className="explanation-header"><div><p className="eyebrow">Under the hood</p><h2>Search strategy</h2></div><Badge className="algorithm-badge" style={{ '--algorithm-color': algorithm === 'dijkstra' ? colors.visited : colors.path }}>{algorithm === 'dijkstra' ? 'Dijkstra' : 'A*'}</Badge></div>
            <Tabs label="Algorithm explanation" items={[{ value: 'dijkstra', label: 'Dijkstra' }, { value: 'astar', label: 'A*' }]} value={algorithm} onChange={setAlgorithm} />
            <p className="explanation-copy">{algorithm === 'dijkstra'
              ? 'A priority queue expands the unvisited node with the smallest known cost. It tracks cost so far and updates neighbors when it finds a cheaper path.'
              : 'A priority queue ranks candidates by cost so far plus a Haversine-based estimate to the destination. The backend supplies this heuristic for its built-in coordinates.'}</p>
            <div className="explanation-steps">{algorithmSteps[algorithm].map(([number, title, description]) => (
              <div className="explanation-step" key={number}><span className="step-number">{number}</span><span className="step-illustration" aria-hidden="true"><i /><i /><i /></span><div><h3>{title}</h3><p>{description}</p></div></div>
            ))}</div>
            <div className="explored-summary"><span><Waypoints size={16} /> Nodes explored</span><strong className="mono">{result ? result.nodes_explored : '—'}</strong></div>
            <p className="backend-note">The step order is the backend’s actual <code>visited_order</code>; the final route uses the returned path.</p>
          </section>
          <section className="visualizer-data-note"><p className="eyebrow">Data source</p><p>{RESULT_LABEL}</p></section>
        </aside>
      </div>
    </div>
  )
}
