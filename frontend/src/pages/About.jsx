import { Activity, ArrowUpRight, Code2, Database, GitBranch, Layers3, Map, ShieldAlert, Sparkles } from 'lucide-react'
import { Badge } from '../components/UI'

const algorithms = [
  { title: 'Dijkstra', tag: 'Weighted · Optimal', color: 'var(--route-dijkstra)', text: 'Finds the minimum accumulated non-negative edge cost using a priority queue.' },
  { title: 'A*', tag: 'Heuristic · Guided', color: 'var(--route-astar)', text: 'Uses the cost so far plus a Haversine-based heuristic to guide the search.' },
  { title: 'BFS', tag: 'Unweighted · Fewest hops', color: 'var(--route-bfs)', text: 'Finds a route with the fewest hops; edge distance and time are not optimized.' },
  { title: 'DFS', tag: 'Unweighted · Depth-first', color: 'var(--route-dfs)', text: 'Finds a route through depth-first exploration; it is not guaranteed to be shortest.' },
]

const features = [
  { icon: Map, title: 'Interactive map', text: 'Explore graph nodes, connections, and computed routes over a geographic map.' },
  { icon: Activity, title: 'Real algorithm output', text: 'Routes, exploration order, costs, and measurements come from the FastAPI backend.' },
  { icon: Database, title: 'Persistent records', text: 'SQLite stores completed searches and saved source/destination favorites.' },
]

const technologies = ['React', 'Vite', 'Tailwind CSS', 'React Leaflet', 'Lucide', 'FastAPI', 'SQLAlchemy', 'SQLite']

export default function About() {
  return (
    <div className="content-page about-page page-enter">
      <section className="about-hero">
        <div className="about-orb about-orb-one" /><div className="about-orb about-orb-two" />
        <div className="about-hero-content">
          <BadgeIcon />
          <p className="eyebrow">Built for curious minds</p>
          <h1 className="gradient-text">Routes, without the guesswork.</h1>
          <p className="about-lede">Intelligent Route Optimization and Pathfinding System</p>
          <p className="about-description">An educational route exploration app that compares graph search methods against a small built-in offline graph.</p>
        </div>
        <div className="about-hero-decoration" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="orbit-node node-a" /><span className="orbit-node node-b" /><span className="orbit-node node-c" /><GitBranch className="orbit-center" size={34} /></div>
      </section>

      <section className="about-section">
        <div className="section-heading"><div><p className="eyebrow">One connected workspace</p><h2>Explore every part of the journey</h2></div><span className="section-index">01 / FEATURES</span></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, text }, index) => (
          <article className="feature-card panel" key={title}>
            <div className="feature-icon"><Icon size={20} /></div><span className="feature-index">0{index + 1}</span>
            <h3>{title}</h3><p>{text}</p>
          </article>
        ))}</div>
      </section>

      <section className="about-section">
        <div className="section-heading"><div><p className="eyebrow">Search strategies</p><h2>Four ways to find a path</h2></div><span className="section-index">02 / ALGORITHMS</span></div>
        <div className="algorithm-grid">{algorithms.map((item, index) => (
          <article className="algorithm-card panel" key={item.title} style={{ '--algorithm-color': item.color }}>
            <div className="algorithm-card-top"><span className="algorithm-index">0{index + 1}</span><span className="algorithm-spark"><Sparkles size={16} /></span></div>
            <h3>{item.title}</h3><Badge className="algorithm-badge" style={{ '--algorithm-color': item.color }}>{item.tag}</Badge>
            <p>{item.text}</p>
          </article>
        ))}</div>
      </section>

      <section className="technology-section panel">
        <div><p className="eyebrow">The toolkit</p><h2>Technology</h2><p className="muted">A focused stack for interactive, data-backed exploration.</p></div>
        <div className="technology-list">{technologies.map((technology) => <span className="technology-chip" key={technology}><Layers3 size={14} />{technology}</span>)}</div>
      </section>

      <section className="limitations-card">
        <span className="limitations-icon"><ShieldAlert size={20} /></span>
        <div><p className="eyebrow">Know before you go</p><h2>Important limitations</h2>
          <ul>
            <li>Results use a small approximate offline graph and are not real-road directions or live traffic.</li>
            <li>Graph edge lengths and speeds are illustrative inputs.</li>
            <li>BFS and DFS are unweighted: BFS minimizes hops, while DFS does not guarantee a shortest route.</li>
            <li>Estimated travel time is derived from the graph’s stored edge distances and speeds.</li>
          </ul>
        </div>
        <ArrowUpRight className="limitations-arrow" size={19} aria-hidden="true" />
      </section>
      <p className="about-footnote"><Code2 size={14} /> Custom graph algorithm on built-in offline dataset</p>
    </div>
  )
}

function BadgeIcon() {
  return <span className="about-brand-icon"><Map size={19} /></span>
}
