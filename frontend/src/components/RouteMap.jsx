import { useEffect, useMemo, useState } from 'react'
import { divIcon } from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

const makeIcon = (kind) => divIcon({
  className: 'route-marker',
  html: `<span class="route-marker-dot ${kind}"></span>`,
  iconSize: [kind === 'node' ? 12 : 18, kind === 'node' ? 12 : 18],
  iconAnchor: [kind === 'node' ? 6 : 9, kind === 'node' ? 6 : 9],
})
const nodeIcon = makeIcon('node')
const startIcon = makeIcon('start')
const endIcon = makeIcon('end')
const emptyNodes = Object.freeze({})
const emptyEdges = Object.freeze([])
const emptyPath = Object.freeze([])

function FitRoute({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1) map.fitBounds(positions, { padding: [55, 55], maxZoom: 8 })
    else if (positions.length === 1) map.setView(positions[0], 8)
  }, [map, positions])
  return null
}

export default function RouteMap({ graph, route, routeColor = 'var(--route-final)', source, destination, className = '' }) {
  const [isLight, setIsLight] = useState(() => document.documentElement.dataset.theme === 'light')
  const nodes = graph?.nodes || emptyNodes
  const edges = graph?.edges || emptyEdges
  const path = route?.path || emptyPath
  const positions = useMemo(() => path.map((name) => nodes[name] ? [nodes[name].lat, nodes[name].lon] : null).filter(Boolean), [path, nodes])
  const graphPositions = useMemo(() => Object.values(nodes).map((point) => [point.lat, point.lon]), [nodes])
  const center = Object.values(nodes).length
    ? [Object.values(nodes).reduce((sum, node) => sum + node.lat, 0) / Object.values(nodes).length,
      Object.values(nodes).reduce((sum, node) => sum + node.lon, 0) / Object.values(nodes).length]
    : [30.9, 76.8]
  useEffect(() => {
    const updateTheme = () => setIsLight(document.documentElement.dataset.theme === 'light')
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  return (
    <div className={`route-map ${className} ${isLight ? 'light-map-tiles' : 'dark-map-tiles'}`}>
      <MapContainer center={center} zoom={7} scrollWheelZoom className="h-full w-full" aria-label="Offline route graph map">
        <TileLayer attribution={attribution} url={tileUrl} />
        {edges.map((edge, index) => {
          const a = nodes[edge.u], b = nodes[edge.v]
          if (!a || !b) return null
          return <Polyline key={`${edge.u}-${edge.v}-${index}`} positions={[[a.lat, a.lon], [b.lat, b.lon]]} pathOptions={{ color: isLight ? '#8490aa' : '#34405f', weight: 1.5, opacity: isLight ? 0.48 : 0.62 }} />
        })}
        {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: routeColor, weight: 15, opacity: 0.2, lineCap: 'round', lineJoin: 'round' }} />}
        {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: routeColor, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round', className: 'route-line' }} />}
        {Object.entries(nodes).map(([name, point]) => {
          const isStart = (source || path[0]) === name
          const isEnd = (destination || (path.length > 1 && path[path.length - 1])) === name
          return (
            <Marker key={name} position={[point.lat, point.lon]} icon={isStart ? startIcon : isEnd ? endIcon : nodeIcon}>
              <Popup><strong>{name}</strong>{isStart && <span className="map-popup-tag">Start</span>}{isEnd && <span className="map-popup-tag">Destination</span>}</Popup>
            </Marker>
          )
        })}
        <FitRoute positions={positions.length ? positions : graphPositions} />
      </MapContainer>
      <div className="map-label"><span className="map-live-dot" /> OFFLINE GRAPH · {Object.keys(nodes).length} NODES</div>
    </div>
  )
}
