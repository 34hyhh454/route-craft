# Route Craft

Route Craft is an educational route-search app built around a small approximate offline graph. The FastAPI backend runs graph algorithms and stores search history and favorites in SQLite; the React frontend visualizes the graph and backend results.

> **Scope:** Results are custom graph algorithms on a built-in offline dataset. This app is not a real-road navigation service and does not provide live traffic or turn-by-turn directions.

## Features

- Interactive OpenStreetMap-backed graph map with route search by distance or estimated time.
- Dijkstra and A* route search, plus backend comparisons with BFS and DFS.
- SVG visualizer that replays the backend's actual visited-node order.
- Route-leg details, recent searches, history filters, and persistent favorites.
- PDF route summaries and a persisted dark/light appearance setting.
- FastAPI health status and explicit loading, empty, and error states.

## Architecture

- **Backend:** FastAPI endpoints call the existing graph algorithms and persist records with SQLAlchemy.
- **Database:** SQLite stores `history` and `favorites`.
- **Frontend:** Vite serves a React single-page app. React Router handles pages; Leaflet and OpenStreetMap tiles provide the map.
- **API client:** `frontend/src/services/api.js` is the frontend's single endpoint layer. Set `VITE_API_URL` to change the backend origin.

### Folder structure

```text
backend/
├── app/
│   ├── algorithms/       # Existing Dijkstra, A*, BFS, DFS implementations
│   ├── utils/            # Graph and distance helpers
│   ├── database.py       # SQLite / SQLAlchemy configuration
│   ├── main.py           # FastAPI app and API endpoints
│   └── models.py         # Search history and favorite tables
├── tests/                # Backend tests
├── route_craft.db        # Default SQLite database (created/used by backend)
├── requirements.txt
├── README.md
└── frontend/
    ├── src/
    │   ├── components/   # Shared map and UI components
    │   ├── hooks/        # Shared data-loading hook
    │   ├── layouts/      # Navigation and application shell
    │   ├── pages/        # Dashboard, Visualizer, History, Favorites, About
    │   ├── services/     # API client and API tests
    │   └── test/         # Vitest setup
    ├── .env.example
    └── package.json
```

## Windows install and run

Open PowerShell in the project root.

### Backend

before running , add these , run command one by one :
from root dir :
1-> uv init 
2-> uv add fastapi uvicorn python-multipart
3-> uv run uvicorn app.main:app --reload 
run this 3rd command or this ⏬ powershell command
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The backend listens at `http://127.0.0.1:8000`. If PowerShell blocks activation, run commands directly with `.\.venv\Scripts\python.exe`.

### Frontend

In a second PowerShell terminal:

```powershell
Set-Location .\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The default API URL is `http://127.0.0.1:8000`. To override it, set `VITE_API_URL` in `frontend/.env` and restart Vite.

## Public deployment (Render)

The root `Dockerfile` builds the frontend and backend into one service, and `render.yaml` configures a Render web service with `/api/health` as its health check and a persistent disk for SQLite. In production the frontend calls the API on the same origin. Render assigns the final public URL after deployment; this workspace does not have a connected Git remote or hosting account, so no public URL exists yet.

1. Create a **private** GitHub repository and push this project root. The root `.gitignore` excludes local databases, virtual environments, build output, and `.env` files.
2. In Render, create a Blueprint from that repository and review `render.yaml`. The service requests a Starter plan and a 1 GiB persistent disk; check current provider pricing before confirming.
3. Wait for the deployment and `/api/health` check to pass. Open the public `onrender.com` URL Render assigns.

This app currently has **no user authentication or per-user data isolation**. A public deployment shares history and favorites with every visitor; anyone can create or delete favorites. Use it only with non-sensitive demo data unless authentication and access controls are added.

## Algorithms

- **Dijkstra:** Priority-queue search for a minimum total non-negative edge cost. Edge cost is either approximate kilometres or estimated hours.
- **A\*:** Dijkstra-style search prioritized by cost so far plus a Haversine-based remaining-cost estimate.
- **BFS:** Finds a path with the fewest hops; it does not minimize weighted distance or time.
- **DFS:** Finds a path through depth-first exploration; it does not guarantee a shortest path.

The map uses actual latitude/longitude coordinates of graph nodes, while graph edge distances and speeds are preconfigured approximate values. They should not be interpreted as measured real-road values.

## API

All endpoints are prefixed with `/api`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Backend status |
| GET | `/graph` | Built-in nodes and edges |
| POST | `/algorithms/{dijkstra\|astar\|bfs\|dfs}` | Run one algorithm |
| POST | `/algorithms/compare` | Run all four algorithms |
| GET | `/history?limit=50` | Read saved searches |
| GET | `/favorites` | List saved favorites |
| POST | `/favorites` | Save a favorite |
| DELETE | `/favorites/{id}` | Delete a favorite |

Algorithm requests contain `source`, `destination`, and `weight` (`distance` or `time`). History limits must be positive and are capped at 200. Favorite names are limited to 120 characters and node fields to 80 characters. Errors include a `detail` message; unknown nodes return 404 and invalid input returns 422.

## Database tables

- **`history`**: source, destination, algorithm, mode, serialized path, distance, estimated time, explored node count, execution time, found status, and timestamp.
- **`favorites`**: user-provided name, source, destination, mode, and creation timestamp.

The default database URL is `sqlite:///./route_craft.db`; `DATABASE_URL` can override it for development and tests.

## Testing and production build

From the project root:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
Set-Location .\frontend
npm test
npm run build
```

Frontend tests cover API success/error handling (404, 422, and network failure) and dashboard route-form validation.

## Screenshot guidance

1. Start the backend and frontend using the commands above.
2. Capture the dashboard with a selected source and destination and a completed route, showing the map and result metrics.
3. Capture the comparison table and the visualizer while nodes are advancing.
4. Capture History and Favorites with data created through the app.
5. Use Windows Snipping Tool or `Win+Shift+S`; avoid presenting example output as real-world navigation.

## Limitations

- The graph is small, approximate, and built into the backend.
- It does not retrieve street networks or live traffic.
- Edge costs are illustrative approximations; estimated travel times are derived from those edge costs and configured speeds.
- BFS minimizes hop count, and DFS does not guarantee an optimal route.
- OpenStreetMap provides map tiles for visual context only; calculated routes follow graph edges.

## Future scope

- Support configurable datasets and route graph import/export.
- Add backend-driven paging and advanced history search.
- Add keyboard-accessible graph exploration and richer algorithm step explanations.
- Add integration and browser-level tests against an isolated backend database.
- Consider a real routing provider only as a separate, explicitly labelled feature.

## Final-year project report outline

1. Abstract and project objectives.
2. Problem statement, scope, and requirements.
3. System architecture and technology selection.
4. Graph representation and algorithm design.
5. API and database schema.
6. Frontend interaction and accessibility.
7. Test strategy, results, and performance observations.
8. Limitations, ethical considerations, and future work.
9. Conclusion and references.
