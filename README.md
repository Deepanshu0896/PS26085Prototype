# 🌊 AGASTYA — Physics-Guided Urban Flood Nowcasting & Emergency Routing

> **Smart India Hackathon (SIH 2026) · Problem Statement 26085**  
> **Catchment Area:** Minto Bridge Underpass, New Delhi (28.6280° N, 77.2197° E)  
> **Target Blackspot:** Natural topographical sag point (Elevation **210.5 m** vs surrounding ridgelines **213.5 m – 216.5 m**)

---

## 📌 Executive Summary
**Agastya** is a physics-guided urban flood nowcasting, PySewer sewer topology synthesis, multi-node choke simulation, and safe emergency evacuation routing prototype.

Minto Bridge Underpass in Central New Delhi is one of India's most critical monsoon waterlogging blackspots. Sitting 3 to 6 meters below Connaught Place (216.5m), DDU Marg (214.0m), and Barakhamba (215.0m), surface runoff funnels into this depression, submerging vehicular transit. Agastya provides rapid municipal decision support:

1. **Hydrological Surcharge Model:** Pairs live Open-Meteo precipitation with a 25-node, 39-conduit gravity drainage network using the Rational Runoff formula ($Q = C \cdot I \cdot A / 360$) and Manning's open-channel equation ($Q = \frac{0.3117}{n} D^{8/3} \sqrt{S}$).
2. **PySewer Integration:** Generates an automated gravity sewer network layout from street centerlines and DEM gradients, enforcing CPHEEO standards ($S \ge 0.002$, $v \ge 0.6\text{ m/s}$, diameters $300\text{--}1800\text{ mm}$).
3. **Multi-Node Choke Simulation:** Simulates silt/debris blockages at one or multiple manholes simultaneously, propagating hydraulic backwater to upstream road segments.
4. **Constrained Safe Ambulance Routing:** Executes modified Dijkstra pathfinding in $<6\text{ ms}$, bypassing road segments exceeding the vehicle water clearance threshold ($15\text{ cm}$).
5. **Deterministic Offline Demo Mode:** Fully cached 25-node topology and client-side hydraulic solver ensure the prototype runs seamlessly even without internet access.

---

## 🔬 WHAT IS REAL VS SYNTHETIC

To maintain rigorous scientific integrity and honest technical claims for SIH 2026, Agastya explicitly delineates empirical real-world inputs from synthetic proxies and prototype heuristics:

| Category | Component | Data Source & Provenance | Classification |
|---|---|---|---|
| **Meteorology** | Real-time Precipitation | [Open-Meteo API](https://open-meteo.com) (lat: 28.6280, lon: 77.2197) with local `rain.json` cache | **REAL / LIVE** (cached offline) |
| **Geospatial** | Road Centerlines & Nodes | OpenStreetMap (OSM) via Overpass API (25 junctions, 39 road segments) | **REAL** |
| **Topography** | Ground Elevation | SRTM / CartoDEM 30m raster sampled at junction nodes (210.5m to 216.5m) | **REAL (DEM-derived)** |
| **Drainage Network** | Underground Sewer Conduit Layout | Real underground municipal sewer blueprints are not public in India. Conduits are auto-generated along road centerlines using the **PySewer method** (Despot et al., *JOSS 2024*). | **SYNTHETIC PROXY** |
| **Pipe Parameters** | Diameters, Roughness, Slope | Sized using CPHEEO standards ($n=0.013$, commercial RC pipes 300–1800mm, $S \ge 0.002$) | **DERIVED / ASSUMED** |
| **Hydrodynamic Flow** | Surcharge & Sag Pooling | 1D Manning full-pipe capacity check coupled with a Rational overland depression cascade. | **PROTOTYPE HYDRAULIC ESTIMATE** |
| **Backwater Effect** | Upstream Surcharge Propagation | Empirically calibrated surcharge increment (+12 cm base scaled with rain and storm duration). | **PROTOTYPE HEURISTIC ESTIMATE** |
| **Vehicle Clearance** | Ambulance Wading Limit | 15.0 cm water depth threshold (typical urban emergency ambulance air intake clearance). | **CONFIGURABLE SAFETY THRESHOLD** |

> [!NOTE]
> Agastya does **NOT** claim full 2D Saint-Venant shallow-water numerical hydrodynamics (which requires hours in solvers like SWMM/Telemac). Instead, Agastya implements a fast, physics-guided 1D proxy solver executing in $<10\text{ ms}$ for real-time municipal emergency dispatch.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────────────┐
                                  │   Open-Meteo REST Weather API  │
                                  │   (Live Hourly Rainfall mm/hr) │
                                  └───────────────┬────────────────┘
                                                  │
                                                  ▼
┌────────────────────────────────┐       ┌────────────────────────────────┐
│   OpenStreetMap + CartoDEM     │──────▶│   FastAPI Python 3.13 Backend  │◀─────── User Rain Slider
│   Minto Bridge Catchment (GIS) │       │   Uvicorn / Port 8000          │         (0–100 mm/hr, 5-120 min)
└────────────────────────────────┘       └───────────────┬────────────────┘
                                                         │
                    ┌────────────────────────────────────┼────────────────────────────────────┐
                    ▼                                    ▼                                    ▼
       ┌───────────────────────────┐       ┌───────────────────────────┐       ┌───────────────────────────┐
       │   Manning Capacity Engine │       │   Multi-Node Choke Model  │       │   Constrained Dijkstra    │
       │   Rational Runoff Surcharge│      │   Upstream Backwater Head │       │   Safe Ambulance Routing  │
       └───────────────────────────┘       └───────────────────────────┘       └───────────────────────────┘
                    │                                    │                                    │
                    └────────────────────────────────────┼────────────────────────────────────┘
                                                         │
                                                         ▼
                                          ┌────────────────────────────────┐
                                          │   React 19 + TypeScript + Vite │
                                          │   Interactive Leaflet Map      │
                                          │   Movable / Minimizable Panel  │
                                          │   Guided Judge Demo Stepper    │
                                          └────────────────────────────────┘
```

---

## ⚡ Mathematical Formulations

### A. Surface Runoff Generation (Rational Formula)
Direct stormwater runoff generated across each catchment node's tributary area:
$$Q_{in} = \frac{C \cdot I \cdot A_{\text{ha}}}{360} \quad [\text{m}^3/\text{s}]$$
Where:
- $C = 0.85$ (impervious urban runoff coefficient for concrete and bitumen)
- $I$ = rainfall intensity in $\text{mm/hr}$
- $A_{\text{ha}} = A_{\text{m}^2} / 10000$ (catchment area in hectares)

### B. Full-Pipe Conduit Capacity (Manning's Formula)
Maximum gravity conveyance capacity of circular storm sewers:
$$Q_{cap} = \frac{1}{n} A R_h^{2/3} S^{1/2} = \frac{0.3117}{n} D^{8/3} \sqrt{S} \quad [\text{m}^3/\text{s}]$$
Where:
- $n = 0.013$ (Manning's roughness coefficient for spun concrete)
- $D$ = internal pipe diameter in meters ($0.3\text{--}1.8\text{ m}$)
- $S = \max\left(\frac{|\Delta z|}{L}, 0.002\right)$ = hydraulic longitudinal slope
- $0.3117 = \frac{\pi}{4^{5/3}}$ is the exact analytical constant for circular pipes flowing full.

### C. Inundation Volume & Sag Depression Accumulation
Excess stormwater exceeding conduit and street inlet capacity accumulates on the surface:
$$Q_{\text{excess}} = \max(0, Q_{in} - Q_{cap})$$
For low-lying sag depressions (Minto Bridge at $210.5\text{ m}$), runoff cascades overland from surrounding ridges ($213.5\text{--}216.5\text{ m}$):
$$V_{\text{excess}} = \left( Q_{\text{excess}} + \sum Q_{\text{cascade}} \right) \cdot \Delta t_{\text{seconds}} \quad [\text{m}^3]$$
Street water depth in centimeters:
$$d_{\text{flood}} = \left( \frac{V_{\text{excess}}}{A_{\text{ponding}}} \right) \times 100 \quad [\text{cm}]$$

### D. Safe Ambulance Pathfinding (Constrained Dijkstra)
The road network graph $G = (V, E)$ is pruned into a safe traversable subgraph $G_{\text{safe}} \subseteq G$:
$$V_{\text{safe}} = \{ v \in V \mid d_{\text{flood}}(v) \le 15.0\text{ cm} \}$$
$$E_{\text{safe}} = \{ (u, v) \in E \mid \max(d_{\text{flood}}(u), d_{\text{flood}}(v)) \le 15.0\text{ cm} \}$$
Dijkstra's algorithm finds the shortest safe path minimizing road traversal length:
$$\mathcal{P}_{\text{safe}} = \arg\min_{\mathcal{P}} \sum_{e \in \mathcal{P}} \text{length}(e)$$

---

## 🛠️ Project Structure

```
prototype26085/
├── backend/
│   ├── main.py                     # FastAPI application & endpoints
│   ├── schemas.py                  # Pydantic v2 request/response models
│   ├── requirements.txt            # Python dependencies
│   ├── data/
│   │   ├── rain.py                 # Open-Meteo REST client & local cache
│   │   └── cache/
│   │       ├── network.json        # Pre-cached 25-node/39-link Minto Bridge graph
│   │       └── rain.json           # Offline monsoon precipitation cache
│   ├── engine/
│   │   ├── capacity.py             # Manning's formula & velocity calculations
│   │   ├── surcharge.py            # Physics-guided surcharge & sag pooling
│   │   ├── graph_build.py          # NetworkX graph constructor from OSM+DEM
│   │   └── pysewer_adapter.py      # PySewer gravity layout & CPHEEO pipe sizing
│   ├── routing/
│   │   ├── safe_route.py           # Dijkstra pathfinding avoiding >15cm flood
│   │   └── choke.py                # Multi-node blockage & backwater propagation
│   └── tests/
│       ├── test_hydraulics.py      # Zero-rain, capacity, duration, sag tests
│       ├── test_routing.py         # Subgraph pruning, endpoint safety checks
│       ├── test_pysewer.py         # CPHEEO compliance, slope, velocity checks
│       ├── test_api.py             # FastAPI REST endpoint integration tests
│       └── benchmark_api.py        # Latency benchmarking script (30 iterations)
├── frontend/
│   ├── package.json                # React 19, TypeScript, Leaflet, Vite
│   ├── src/
│   │   ├── App.tsx                 # Main operator dashboard & demo presets
│   │   ├── components/
│   │   │   ├── Sidebar.tsx         # Intensity/duration sliders & controls
│   │   │   ├── FloodMap.tsx        # Leaflet map with depth markers & corridors
│   │   │   └── AlertPanel.tsx      # Movable/minimizable 3-tab alert center
│   │   ├── lib/
│   │   │   ├── api.ts              # FastAPI REST client
│   │   │   └── networkData.ts      # 25-node offline fallback topology & solvers
│   │   └── index.css               # Design system & dark glassmorphism
└── README.md                       # Comprehensive documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+** (Tested on Python 3.13)
- **Node.js 18+** (Tested on Node.js 22)

### 1. Start Backend (FastAPI)
```powershell
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 2. Start Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
- Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 🧪 Automated Test Suite

Agastya includes an automated test suite verifying all 13 critical functional scenarios:

```powershell
python -m pytest backend/tests -v
```

### Test Coverage Summary:
- **`test_hydraulics.py`**:
  - Rain = 0 yields strictly 0.0 cm depth everywhere (even when manholes are choked).
  - Manning pipe capacity $Q_{\text{cap}} > 0$ for all valid dimensions.
  - Heavy rain (75 mm/hr) strictly exceeds moderate rain (35 mm/hr).
  - Storm duration accumulation: 60 min depth strictly exceeds 15 min depth.
  - Single-node choke increases local and upstream flood depth.
  - Multi-node choke accumulates impact across adjoining sectors.
  - Minto Bridge sag concentration exceeds surrounding ridgelines.
  - Risk classification matches defined severity bands.
- **`test_routing.py`**:
  - Dry routing finds shortest direct path.
  - Flooded roads ($>15\text{ cm}$) are excluded from Dijkstra paths.
  - Submerged origin or destination returns explicit safety alert and unreachable state.
  - Complete corridor blockage returns clean unreachable state.
- **`test_pysewer.py`**:
  - PySewer status metadata reports honest solver mode.
  - 39 conduits synthesized with standard diameters (300–1800mm).
  - Slopes satisfy CPHEEO minimum ($S \ge 0.002$).
- **`test_api.py`**:
  - All 8 FastAPI endpoints return HTTP 200 with schema-validated payloads.

---

## ⏱️ Empirical Performance Benchmarks

Measured on local hardware across 30 iterations per endpoint:

| Endpoint | Method | Functionality | Mean Latency | Median | P95 Latency | Status |
|---|---|---|---|---|---|---|
| `/api/simulate` | `POST` | 25-Node Inundation & Surcharge Solver | **5.28 ms** | 5.23 ms | 6.02 ms | ✅ Sub-second |
| `/api/route` | `POST` | Dijkstra Safe Ambulance Pathfinding | **5.41 ms** | 5.38 ms | 6.04 ms | ✅ Sub-second |
| `/api/choke` | `POST` | Multi-Node Blockage & Backwater Propagation | **8.22 ms** | 5.39 ms | 25.43 ms | ✅ Sub-second |
| `/api/pysewer/status` | `GET` | PySewer Methodology & CPHEEO Limits | **4.60 ms** | 4.62 ms | 5.05 ms | ✅ Sub-second |
| `/api/pysewer/synthesize` | `POST` | 39-Conduit Pipe Layout & Diameter Sizing | **7.41 ms** | 7.19 ms | 9.04 ms | ✅ Sub-second |
| `/api/network` | `GET` | Full GeoJSON Topology (25 nodes, 39 links) | **6.22 ms** | 6.20 ms | 6.90 ms | ✅ Sub-second |

*Frontend Production Build Time:* `npm run build` bundles all TypeScript modules in **809 ms** (0 errors).

---

## 🎬 15-Step Live Demonstration Script for SIH Judges

The dashboard includes a dedicated **Guided Demo Quick Action Bar** at the top right of the map header to demonstrate all capabilities deterministically in 90 seconds:

1. **Open Dashboard:** Load `http://localhost:5173`. Point out the dark glassmorphic UI, Minto Bridge centered map, and 6 top KPI cards.
2. **Step 1 — Dry Baseline:** Click `1. Dry` in the demo bar. Rain is set to $0\text{ mm/hr}$. Observe max flood depth is strictly $0.0\text{ cm}$ across all 25 nodes.
3. **Step 2 — Moderate Rain:** Click `2. Moderate`. Rain is set to $35\text{ mm/hr}$ for 30 minutes. Minor pooling appears at Minto Underpass ($6.4\text{ cm}$, Low Risk, green/cyan).
4. **Step 3 — Monsoon Downpour:** Click `3. Downpour`. Rain surges to $75\text{ mm/hr}$. Point out Minto Bridge Underpass turning **CRITICAL RED** ($>30\text{ cm}$).
5. **Step 4 — Storm Duration Scaling:** Drag the Duration slider from $15\text{ min}$ to $60\text{ min}$. Show cumulative volume scaling flood depth from $13.5\text{ cm}$ to $35.8\text{ cm}$.
6. **Step 5 — Enable Choke Simulation:** Click `4. Choke` or toggle the Choke switch. Blocked manhole halo rings appear on the map.
7. **Step 6 — Multi-Node Silt Clog:** Click additional nodes (e.g. `ddu_marg_west`). Observe multiple blocked halos.
8. **Step 7 — Backwater Surcharge:** Show upstream neighbors surcharging due to conduit blockage.
9. **Step 8 — Open Alert Center:** Click the Alert Center. Show severity filters (All / Critical / High) and individual alert dismissal.
10. **Step 9 — Drag & Minimize Alert Panel:** Drag the panel across the map by its header grip. Click `─` to collapse it into the floating glowing status pill. Click `↺ Reset` to restore.
11. **Step 10 — Open Safe Ambulance Corridor:** Click `5. Route` in the demo bar or toggle the Ambulance Route switch.
12. **Step 11 — Origin & Destination Callouts:** Point out the green **🟢 START: CP Outer Circle North** and red **🏁 DESTINATION: Barakhamba Road** markers on the map.
13. **Step 12 — Flooded Segment Bypass:** Show how the green safe corridor dynamically diverts away from the submerged Minto Bridge underpass.
14. **Step 13 — Swap Direction:** Click `⇅ Swap Direction` in the sidebar. Dijkstra immediately recalculates the return evacuation corridor in $<6\text{ ms}$.
15. **Step 14 — PySewer Gravity Inspector:** Switch to the **PySewer** tab in the Alert Panel. Show the 39 synthesized conduits, CPHEEO self-cleansing velocity compliance ($v \ge 0.6\text{ m/s}$), slope percentages, and full-pipe flow capacities ($Q_{\text{cap}}$).
16. **Step 15 — Offline Resilience:** Turn off backend or disconnect Wi-Fi. The dashboard automatically switches to **OFFLINE DEMO MODE** and continues computing simulation and routing without interruption.

---

## 📡 REST API Reference

| Endpoint | Method | Request Payload | Response Attributes |
|---|---|---|---|
| `/api/simulate` | `POST` | `{"rain_mm": 50.0, "minutes": 30, "blocked_nodes": []}` | `depths`, `nodes`, `summary` (max depth, risk breakdown) |
| `/api/route` | `POST` | `{"source": "cp_outer_n", "target": "barakhamba_junction", "threshold_cm": 15.0, ...}` | `path`, `distance_m`, `eta_safe_sec`, `detour_delay_sec`, `blocked_count` |
| `/api/choke` | `POST` | `{"node_ids": ["minto_bridge_center"], "rain_mm": 50.0, "minutes": 30}` | `choked_node`, `flooded_neighbours`, `depths_after`, `total_depth_increase_cm` |
| `/api/pysewer/status` | `GET` | *None* | `mode`, `standards`, `hydraulic_solver`, `minimum_slope`, `self_cleansing_velocity_ms` |
| `/api/pysewer/synthesize` | `POST` | Query: `design_rain_mm_hr=35.0` | `total_pipes`, `total_length_m`, `compliance_pct`, `pipes` (diameter, slope, velocity, capacity) |
| `/api/network` | `GET` | *None* | `nodes` (lat, lon, elevation), `edges` (length, diameter) |
| `/api/rain/live` | `GET` | *None* | `current_rain_mm`, `temperature`, `wind`, `hourly_forecast`, `source` |
| `/health` | `GET` | *None* | `status: "ok"`, `project: "Agastya"`, `location` |

---

## ⚖️ Known Limitations & Future Work

1. **Hydraulic Simplification:** Agastya couples Manning's pipe equation with an empirical sag accumulation model. While sufficient for sub-second municipal nowcasting, future iterations can couple unsteady 1D/2D SWMM Saint-Venant solvers for multi-hour continuous simulation.
2. **Synthetic Drainage Topology:** Real underground sewer asset databases are classified or unavailable in many Indian municipalities. The PySewer Steiner tree methodology generates high-fidelity proxies, but actual municipal telemetry should be calibrated when available.
3. **Pumping Station Telemetry:** Minto Bridge operates 4 emergency diesel pumps during peak monsoon events. Agastya assumes a baseline outflow pump rate ($0.02\text{ m}^3/\text{s}$); integrating real-time SCADA IoT pump telemetry will further refine flood onset timing.
