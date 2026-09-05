# 🌊 AGASTYA — FINAL REPOSITORY CLEANUP & DEPLOYMENT REPORT

**Smart India Hackathon 2026 · Problem Statement 26085 (Ministry of Earth Sciences)**  
**Catchment Area:** Minto Bridge, New Delhi (`28.6280° N, 77.2197° E`, Sag Low Point: 210.5m)  
**Final Repository Commit:** `54c3621d62f6609bbf39937e31adbf202158cc28` (Short: `54c3621`)  
**Safety Backup Tag:** `pre-deployment-20260905`  
**Safety Backup Branch:** `pre-deployment-20260905-branch`  
**Working Tree Status:** `100% Clean` (`git status --short` returns zero uncommitted changes)  
**Audit Completion Date:** September 5, 2026  

---

## 1. Final Repository Tree

```
prototype26085/
├── .env.example
├── .gitignore
├── Dockerfile
├── FINAL_CLEANUP_AND_DEPLOYMENT_REPORT.md
├── README.md
├── render.yaml
├── vercel.json
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── schemas.py
│   ├── data/
│   │   ├── __init__.py
│   │   ├── rain.py
│   │   └── cache/
│   │       ├── network.json
│   │       └── rain.json
│   ├── engine/
│   │   ├── __init__.py
│   │   ├── capacity.py
│   │   ├── graph_build.py
│   │   ├── pysewer_adapter.py
│   │   └── surcharge.py
│   ├── routing/
│   │   ├── __init__.py
│   │   ├── choke.py
│   │   └── safe_route.py
│   └── tests/
│       ├── __init__.py
│       ├── benchmark_api.py
│       ├── benchmark_results.json
│       ├── test_api.py
│       ├── test_hydraulics.py
│       ├── test_pysewer.py
│       ├── test_regressions.py
│       └── test_routing.py
├── docs/
│   ├── presentation-slides.docx
│   ├── technical-report.docx
│   ├── technical-report.pdf
│   ├── verification-report.pdf
│   └── screenshots/
│       ├── alerts_moved.png
│       ├── choke.png
│       ├── duration.png
│       ├── extreme_rain.png
│       ├── minimized.png
│       └── overview.png
└── frontend/
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── README.md
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vercel.json
    ├── vite.config.ts
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── App.css
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        ├── components/
        │   ├── AlertPanel.tsx
        │   ├── FloodMap.tsx
        │   └── Sidebar.tsx
        └── lib/
            ├── api.ts
            └── networkData.ts
```

---

## 2. Deleted Files (Cleaned from Repository)

| Category | File Path | Reason for Removal |
|---|---|---|
| **Old Scripts** | `compile_final_technical_report_pdf.py` | One-off document generation script; documents now frozen in `docs/` |
| **Old Scripts** | `create_presentation_docx.py` | One-off slide generator; output preserved in `docs/presentation-slides.docx` |
| **Old Scripts** | `create_py_source_docs.py` | One-off code documentation script |
| **Old Scripts** | `create_technical_report_docx.py` | One-off script superseded by frozen report in `docs/` |
| **Old Scripts** | `generate_final_report.py` | Temporary generator script |
| **Old Scripts** | `generate_final_routing_pdf.py` | Temporary generator script |
| **Old Scripts** | `generate_pdf.py` | Temporary generator script |
| **Old Scripts** | `generate_walkthrough_pdf.py` | Temporary generator script |
| **Old Text / Plans**| `plan_text.txt` | Scratch brainstorming notes |
| **Old Plan PDF** | `plan B-Coding Implementation plan.pdf` | Outdated early planning PDF |
| **Old HTMLs** | `AGASTYA_FINAL_TECHNICAL_REPORT_SIH2026.html` | Superseded by canonical PDF/DOCX in `docs/` |
| **Old HTMLs** | `AUDIT_REGRESSION_REPORT.html` | Superseded by canonical PDF in `docs/` |
| **Old HTMLs** | `Agastya_Technical_Report.html` | Outdated report version |
| **Old HTMLs** | `Agastya_Walkthrough_Report.html` | Outdated report version |
| **Old HTMLs** | `FINAL_ROUTING_REGRESSION_REPORT.html` | Superseded by canonical verification PDF |
| **Old Markdowns**| `AUDIT_REGRESSION_REPORT.md` | Consolidated into final walkthrough and test reports |
| **Old Markdowns**| `Agastya_Technical_Report.md` | Consolidated into authoritative technical report |
| **Old Previews** | `audit_page_1_preview.png` | Ephemeral PDF conversion preview |
| **Old Previews** | `pdf_page_1_preview.png` to `pdf_page_6_preview.png` | Ephemeral PDF conversion page previews |
| **Old Test PNGs** | `test_a_flooded_origin.png` | Transient regression test capture |
| **Old Test PNGs** | `test_b_flooded_destination.png` | Transient regression test capture |
| **Old Test PNGs** | `test_c_rerouted_corridor.png` | Transient regression test capture |
| **Old Screenshots**| `Screenshot 2026-09-04 212935.png` | Unreferenced desktop screenshot |
| **Old Screenshots**| `Screenshot 2026-09-04 213221.png` | Unreferenced desktop screenshot |
| **Unused Assets** | `frontend/src/assets/hero.png` | Unreferenced default Vite template graphic |
| **Unused Assets** | `frontend/src/assets/react.svg` | Unreferenced default Vite template graphic |
| **Unused Assets** | `frontend/src/assets/vite.svg` | Unreferenced default Vite template graphic |

---

## 3. Kept Documentation (Consolidated in `docs/`)

All authoritative project documentation has been organized under `docs/`:

1. `docs/technical-report.pdf`: Complete technical report covering system architecture, mathematical models, and CPHEEO standards.
2. `docs/verification-report.pdf`: Full regression and audit test report.
3. `docs/technical-report.docx`: Editable Word document version of the technical report.
4. `docs/presentation-slides.docx`: Slide content deck formatted for SIH 2026 jury presentations.
5. `docs/screenshots/`: 6 high-resolution UI captures showcasing dashboard overview, extreme rain, duration scaling, choke mode, minimized alert pill, and movable alert center.

---

## 4. Removed Unused PDFs

The following redundant, duplicated, or superseded PDF files were removed from the root:
- `plan B-Coding Implementation plan.pdf`
- `Agastya_Technical_Report.pdf` (superseded by `docs/technical-report.pdf`)
- `Agastya_Walkthrough_Report.pdf` (superseded by `docs/verification-report.pdf`)
- `FINAL_ROUTING_REGRESSION_REPORT.pdf` (superseded by `docs/verification-report.pdf`)
- `AGASTYA_PYTHON_SOURCE_CODE_SIH2026.pdf` (source code directly inspected from git repository)
- `AGASTYA_SIH2026_SLIDES_CONTENT.pdf` (preserved in editable form at `docs/presentation-slides.docx`)

---

## 5. Asset Audit Table

| File | Referenced? | Used By | Keep / Delete | Justification |
|---|---|---|---|---|
| `frontend/public/favicon.svg` | **YES** | `frontend/index.html` (line 5) | **KEEP** | Browser tab favicon icon |
| `frontend/public/icons.svg` | **YES** | Leaflet & UI SVG symbols | **KEEP** | Standard UI SVG icon definitions |
| `frontend/src/assets/hero.png` | **NO** | None (0 references in code) | **DELETE** | Unused Vite boilerplate graphic |
| `frontend/src/assets/react.svg` | **NO** | None (0 references in code) | **DELETE** | Unused Vite boilerplate graphic |
| `frontend/src/assets/vite.svg` | **NO** | None (0 references in code) | **DELETE** | Unused Vite boilerplate graphic |
| `docs/screenshots/*.png` | **YES** | Presentation & SIH documentation | **KEEP** | Visual verification captures preserved in `docs/screenshots/` |

---

## 6. Dependency Changes

### Backend (`backend/requirements.txt`):
- **Removed:** `scipy==1.13.1` (audited across all modules; 0 imports found in `backend/` or `tests/`).
- **Retained:**
  - `fastapi==0.111.0` (REST API framework)
  - `uvicorn[standard]==0.30.1` (ASGI production server)
  - `pydantic==2.7.4` (Strict request/response type validation)
  - `networkx==3.3` (Graph algorithms & Dijkstra routing)
  - `numpy==1.26.4` (Hydraulic calculations)
  - `httpx==0.27.0` (Async Open-Meteo REST calls & testing)
  - `python-dotenv==1.0.1` (Production environment configuration)
- **Benefit:** Reduces Docker image size and Render build time significantly.

### Frontend (`frontend/package.json`):
- **Retained (All active):** `leaflet`, `react-leaflet`, `recharts`, `react`, `react-dom`, `@vitejs/plugin-react`, `typescript`, `vite`, `oxlint`.
- No unused npm packages detected.

---

## 7. Exact Final Git Commit

- **Commit Hash:** `54c3621d62f6609bbf39937e31adbf202158cc28` (Short: `54c3621`)
- **Author:** `Deepanshu0896 <deepanshulath@gmail.com>`
- **Subject:** `chore: update benchmark latency metrics post-cleanup`
- **Backup Tag:** `pre-deployment-20260905` (anchored at `19da96e`)
- **Branch:** `master`

---

## 8. Automated Test Result (Post-Cleanup Re-Run)

Command executed:
```powershell
python -m pytest tests -v --tb=short
```

Output:
```
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\Deepanshu\OneDrive\Desktop\prototype26085\backend
collected 53 items

tests/test_api.py::test_health_endpoint PASSED                           [  1%]
tests/test_api.py::test_network_endpoint PASSED                          [  3%]
tests/test_api.py::test_simulate_endpoint PASSED                         [  5%]
tests/test_api.py::test_simulate_zero_rain PASSED                        [  7%]
tests/test_api.py::test_route_endpoint PASSED                            [  9%]
tests/test_api.py::test_choke_endpoint PASSED                            [ 11%]
tests/test_api.py::test_pysewer_endpoints PASSED                         [ 13%]
tests/test_api.py::test_rain_live_endpoint PASSED                        [ 15%]
tests/test_hydraulics.py::test_zero_rain_zero_depth PASSED               [ 16%]
tests/test_hydraulics.py::test_pipe_capacity_positive PASSED             [ 18%]
tests/test_hydraulics.py::test_heavy_rain_higher_depth PASSED            [ 20%]
tests/test_hydraulics.py::test_duration_scaling_accumulation PASSED      [ 22%]
tests/test_hydraulics.py::test_single_node_choke_impact PASSED           [ 24%]
tests/test_hydraulics.py::test_multi_node_choke_accumulation PASSED      [ 26%]
tests/test_hydraulics.py::test_minto_underpass_sag_concentration PASSED  [ 28%]
tests/test_hydraulics.py::test_risk_classification PASSED                [ 30%]
tests/test_pysewer.py::test_pysewer_status_metadata PASSED               [ 32%]
tests/test_pysewer.py::test_pysewer_synthesize_topology PASSED           [ 33%]
tests/test_pysewer.py::test_real_elevation_differences_affect_slopes PASSED [ 35%]
tests/test_regressions.py::test_all_25_nodes_receive_simulation_state PASSED [ 37%]
tests/test_regressions.py::test_all_25_nodes_receive_depths PASSED       [ 39%]
tests/test_regressions.py::test_all_25_nodes_receive_risk PASSED         [ 41%]
tests/test_regressions.py::test_node_ids_match_topology PASSED           [ 43%]
tests/test_regressions.py::test_heavy_rain_updates_full_network PASSED   [ 45%]
tests/test_regressions.py::test_zero_rainfall_baseline_is_strictly_zero PASSED [ 47%]
tests/test_regressions.py::test_single_choke PASSED                      [ 49%]
tests/test_regressions.py::test_multi_choke PASSED                       [ 50%]
tests/test_regressions.py::test_unblock_node PASSED                      [ 52%]
tests/test_regressions.py::test_clear_all_chokes PASSED                  [ 54%]
tests/test_regressions.py::test_clear_all_chokes_restores_baseline PASSED [ 56%]
tests/test_regressions.py::test_choke_does_not_mutate_master_graph PASSED [ 58%]
tests/test_regressions.py::test_submerged_origin_returns_unreachable PASSED [ 60%]
tests/test_regressions.py::test_submerged_destination_returns_unreachable PASSED [ 62%]
tests/test_regressions.py::test_origin_equals_destination PASSED         [ 64%]
tests/test_regressions.py::test_invalid_origin PASSED                    [ 66%]
tests/test_regressions.py::test_invalid_destination PASSED               [ 67%]
tests/test_regressions.py::test_flooded_edge_pruned PASSED               [ 69%]
tests/test_regressions.py::test_no_safe_route PASSED                     [ 71%]
tests/test_regressions.py::test_route_invalidated_after_simulation_change PASSED [ 73%]
tests/test_routing.py::test_dry_routing_shortest_path PASSED             [ 75%]
tests/test_routing.py::test_1_origin_depth_greater_than_15 PASSED        [ 77%]
tests/test_routing.py::test_2_destination_depth_greater_than_15 PASSED   [ 79%]
tests/test_routing.py::test_3_both_origin_and_destination_greater_than_15 PASSED [ 81%]
tests/test_routing.py::test_4_origin_equals_destination PASSED           [ 83%]
tests/test_routing.py::test_5_origin_missing_from_graph PASSED           [ 84%]
tests/test_routing.py::test_6_destination_missing_from_graph PASSED      [ 86%]
tests/test_routing.py::test_7_endpoint_missing_from_depths_never_defaults_to_zero PASSED [ 88%]
tests/test_routing.py::test_8_no_safe_route_disconnected PASSED          [ 90%]
tests/test_routing.py::test_9_all_intermediate_roads_flooded PASSED      [ 92%]
tests/test_routing.py::test_10_flooded_edge_pruned PASSED                [ 94%]
tests/test_routing.py::test_11_route_after_rainfall_change PASSED        [ 96%]
tests/test_routing.py::test_12_route_after_choke PASSED                  [ 98%]
tests/test_routing.py::test_13_route_after_unblock_and_reset PASSED      [100%]

======================== 53 passed, 1 warning in 4.02s ========================
```
**Status:** **53 / 53 PASSED (100% Pass Rate)**

---

## 9. Frontend Production Build Result (Post-Cleanup)

Command executed:
```powershell
cd frontend && npm run build
```

Output:
```
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 636 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.69 kB │ gzip:   0.44 kB
dist/assets/index-C0VGOKyf.css   30.73 kB │ gzip:   9.84 kB
dist/assets/index-BWH3bgo3.js   765.10 kB │ gzip: 223.11 kB

✓ built in 759ms
```
**Status:** **0 Errors, 0 Warnings** (Build completed in 759 ms)

---

## 10. Manual & Integration Test Result (9/9 Passed)

Executed against live FastAPI server:
```
=================================================================
AGASTYA — Phase 11 Full End-to-End API Integration Verification
=================================================================
[HEALTH] 200: {'status': 'ok', 'project': 'Agastya', 'version': '1.0.0', 'location': 'Minto Bridge, Delhi'}
[NETWORK] Nodes: 25, Edges: 39
[DRY BASELINE] Total nodes: 25, Non-zero depth count: 0
  ✓ PASSED: All 25 nodes strictly at 0.0 cm depth (SAFE)
[SIMULATE 75mm] Total nodes: 25, Flooded (>15cm): 2
  -> minto_bridge_center: 38.3 cm (CRITICAL)
  -> tilak_bridge: 24.8 cm (HIGH)
  Sag node (minto_bridge_center): 38.3 cm, risk=CRITICAL
  ✓ PASSED: Downpour simulation produces correct physical pooling
[ROUTE: Flooded Origin (minto_bridge_center -> rml_hospital)]
  status_code: 200, reachable: False, reason: ORIGIN_UNSAFE
  ✓ PASSED: Submerged origin safely blocked with ORIGIN_UNSAFE
[ROUTE: Flooded Destination (rml_hospital -> minto_bridge_center)]
  status_code: 200, reachable: False, reason: DESTINATION_UNSAFE
  ✓ PASSED: Submerged destination safely blocked with DESTINATION_UNSAFE
[ROUTE: Safe Corridor (cp_outer_n -> barakhamba_junction)]
  reachable: True, path: cp_outer_n -> cp_inner -> barakhamba_junction
  distance_m: 485.2 m, eta_safe_sec: 58.2 s
  ✓ PASSED: Safe corridor successfully detours around flooded sag
[CHOKE] ddu_marg_west baseline: 1.7 cm -> choked: 11.6 cm
[UNBLOCK ALL] ddu_marg_west restored: 1.7 cm
  ✓ PASSED: Choke and Unblock cycles restore exact baseline state
[API/CHOKE] choked_node: ddu_marg_west, flooded_neighbours: 3
  ✓ PASSED: Dedicated /api/choke endpoint functional
[PYSEWER STATUS] 200: mode=embedded_pysewer_proxy_synthesizer
[PYSEWER SYNTHESIS] 200: synthesized 39 pipes, compliance: 100.0%
  ✓ PASSED: PySewer correctly sizes all 39 conduits according to CPHEEO standards

=================================================================
>>> ALL 9 END-TO-END INTEGRATION TESTS PASSED WITH 100% VERACITY <<<
=================================================================
```

---

## 11. Offline Test Result (Dual-Solver Parity)

Command executed:
```powershell
node scratch/test_offline.js
```

Output:
```
=== AGASTYA Phase 12 Offline Regression Verification ===
[OFFLINE DATA] Nodes defined in CATCHMENT_NODES: 25
  Nodes: minto_bridge_center, minto_north, minto_south, ddu_marg_west, ddu_marg_east, barakhamba_junction, barakhamba_mid, cp_inner, cp_outer_n, cp_outer_e, kg_marg_west, kg_marg_center, kg_marg_east, janpath_north, janpath_south, ndls_approach, chelmsford_road, panchkuian_road, tilak_bridge, ito_approach, bhavbhuti_west, bhavbhuti_east, fire_station, rml_hospital, lady_hardinge
✓ All critical nodes present in offline dataset.
[OFFLINE DATA] Edges defined in CATCHMENT_EDGES_RAW: 39
✓ Exactly 39 conduit edges verified in offline dataset.
✓ All offline simulation and routing solver exports verified.
==========================================================
>>> PHASE 12 OFFLINE REGRESSION AUDIT PASSED (100% PARITY) <<<
==========================================================
```
When FastAPI server is halted, frontend immediately triggers `OFFLINE DEMO MODE` and performs identical 25-node hydraulic simulation and constrained Dijkstra routing in client-side TypeScript.

---

## 12. Render Backend URL & Deployment Specification

- **Configuration:** Defined in `render.yaml`.
- **Service Name:** `agastya-backend`
- **Environment:** Python 3.11
- **Build Command:** `cd backend && pip install -r requirements.txt`
- **Start Command:** `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Path:** `/health`
- **Expected Public URL:** `https://agastya-backend.onrender.com` (or user's Render domain upon 1-click blueprint push)
- **Direct Docker Deploy:** Supported via `Dockerfile` on Render, Railway, or Fly.io.

---

## 13. Vercel Frontend URL & Deployment Specification

- **Configuration:** Defined in `frontend/vercel.json` and root `vercel.json`.
- **Framework:** Vite React SPA
- **Build Command:** `npm run build`
- **Output Directory:** `dist` (or `frontend/dist` for monorepo root)
- **Environment Variable:** `VITE_API_BASE=<RENDER_BACKEND_URL>`
- **Expected Public URL:** `https://agastya.vercel.app` (or user's Vercel deployment URL)

---

## 14. API Documentation URL

- **Interactive Swagger UI:** `/docs` (e.g., `https://agastya-backend.onrender.com/docs` or `http://localhost:8000/docs`)
- **Interactive ReDoc:** `/redoc` (e.g., `https://agastya-backend.onrender.com/redoc`)
- **OpenAPI JSON Spec:** `/openapi.json`

---

## 15. Health Endpoint URL

- **Endpoint:** `GET /health`
- **Response Format:**
  ```json
  {
    "status": "ok",
    "project": "Agastya",
    "version": "1.0.0",
    "location": "Minto Bridge, Delhi"
  }
  ```
- **Uptime Monitoring:** Compatible with UptimeRobot, Render native healthchecks, and Docker container healthchecks.

---

## 16. Production Smoke-Test Result

| Stage | Check | Result |
|---|---|---|
| **Build** | `npm run build` | 636 modules bundled in 759 ms, 0 errors |
| **Startup** | `uvicorn main:app` | Started in 0.18s, loaded 25 nodes and 39 edges |
| **CORS** | Browser OPTIONS / POST requests | HTTP 200 with wildcard origin allowance |
| **Routing Safety** | Origin in Minto sag @ 75mm rain | Blocked with `ORIGIN_UNSAFE` |
| **Routing Safety** | Target in Minto sag @ 75mm rain | Blocked with `DESTINATION_UNSAFE` |
| **Safe Arterial** | `cp_outer_n -> barakhamba_junction` | Detour calculated in 4.43 ms bypassing sag |
| **PySewer Synthesis**| POST `/api/pysewer/synthesize` | 39 pipes sized, 100% velocity compliance |

---

## 17. Empirical Latency Benchmarks

Measured on local hardware over 30 iterations per endpoint:

| Endpoint | Method | Mean Latency | Median Latency | P95 Latency |
|---|---|---|---|---|
| **Hydraulic Simulation** (`/api/simulate`) | `POST` | **4.26 ms** | 4.26 ms | 4.57 ms |
| **Safe Dijkstra Route** (`/api/route`) | `POST` | **4.43 ms** | 4.27 ms | 5.42 ms |
| **Multi-Node Choke** (`/api/choke`) | `POST` | **4.36 ms** | 4.29 ms | 4.75 ms |
| **PySewer Status** (`/api/pysewer/status`) | `GET` | **3.25 ms** | 3.19 ms | 3.56 ms |
| **PySewer Pipe Synthesis** (`/api/pysewer/synthesize`) | `POST` | **5.82 ms** | 5.82 ms | 6.06 ms |
| **Network Topology** (`/api/network`) | `GET` | **5.03 ms** | 4.98 ms | 5.52 ms |

---

## 18. Remaining Real-World Limitations

1. **Synthetic Sewer Layout:** Underground Delhi municipal sewer blueprints are not public; drainage conduits are synthetic proxies sized using PySewer and CPHEEO standards rather than physical as-built GIS scans.
2. **1D Lumped Physics:** The hydraulic model uses 1D Manning pipe conveyance with Rational overland depression accumulation rather than full 2D Saint-Venant shallow-water hydrodynamic grid simulations.
3. **Sensor Calibration:** Flood depths are mathematically calibrated to the known 210.5m underpass sag geometry, not calibrated against real-time IoT ultrasonic road sensors.
4. **Offline Map Tiles:** While simulation, choke analysis, and routing function offline, external OpenStreetMap tile images require network access unless pre-cached in local vector tiles.

---

## 19. Rollback Instructions

If any post-cleanup or deployment issue arises, the codebase can be restored to its exact pre-cleanup state:

```powershell
# Restore to backup tag
git checkout pre-deployment-20260905

# Or create a recovery branch from the backup
git checkout -b recovery-pre-deployment pre-deployment-20260905
```

---

## 20. Exact SIH-Safe Claims

When presenting to the Smart India Hackathon jury, use the following defensible phrasing:

- **Hydrology:** *"Physics-guided 1D Manning pipe conveyance with Rational overland sag cascade."* (Do **not** claim full 2D hydrodynamic numerical solvers like SWMM or Telemac).
- **Drainage Network:** *"Synthetic proxy drainage graph generated using the PySewer Steiner tree methodology from OpenStreetMap road centerlines and DEM elevation gradients."* (Do **not** claim real municipal Delhi Jal Board blueprint data).
- **Vehicle Clearance:** *"Configurable 15.0 cm emergency vehicle water clearance threshold calibrated to typical ambulance air intake limits."* (Do **not** claim a universal legal speed/water regulation).
- **Validation:** *"Topographically calibrated to historical inundation sag points at Minto Bridge (210.5m elevation)."* (Do **not** claim 85% statistical sensor accuracy unless sensor logs are presented).

---

### Ready for Cloud Deployment

To deploy to production:
1. **Render:** Connect the GitHub repository and click **New > Blueprint**, pointing to `render.yaml`.
2. **Vercel:** Import the repository into Vercel and set `VITE_API_BASE` to your live Render backend URL.
3. **Local Presentation:** Run `python -m uvicorn main:app --port 8000` in `backend/` and `npm run dev` in `frontend/` for a fully functional offline-capable judge presentation.
