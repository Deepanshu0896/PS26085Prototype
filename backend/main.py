"""
Agastya — FastAPI Main Application
====================================
Urban Flood Nowcasting API for Minto Bridge, Delhi.

Endpoints:
  POST /api/simulate  — Rain mm → flood depths per node
  POST /api/route     — Safe ambulance route (Dijkstra)
  POST /api/choke     — Block a manhole → recompute flooding
  GET  /api/rain/live — Real-time rain from Open-Meteo
  GET  /health        — Health check
  GET  /api/network   — Full network graph (for map rendering)
"""

import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    SimulateRequest, SimulateResponse, NodeDepth,
    RouteRequest, RouteResponse,
    ChokeRequest, ChokeResponse,
    HealthResponse,
)
from engine.graph_build import build_graph_from_cache, get_node_coordinates, get_edge_list
from engine.surcharge import simulate, classify_risk, get_flood_summary
from routing.safe_route import safe_route
from routing.choke import simulate_choke
from data.rain import fetch_live_rain
from engine.pysewer_adapter import get_pysewer_status, synthesize_sewer_topology

# ─── App Setup ─────────────────────────────────────────────────

app = FastAPI(
    title="Agastya — Urban Flood Nowcasting API",
    description=(
        "Real-time flood depth simulation, safe ambulance routing, "
        "and choke point analysis for Minto Bridge, Delhi. "
        "SIH 2026 · Problem Statement 26085."
    ),
    version="1.0.0",
)

# ─── CORS Configuration ────────────────────────────────────────
# In development and production, explicitly whitelist authorized origins.
# Never default to unrestricted "*" in production.
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

env_origins = os.environ.get("FRONTEND_ORIGIN", "") or os.environ.get("FRONTEND_ORIGINS", "")
if env_origins:
    custom_origins = [orig.strip().rstrip("/") for orig in env_origins.replace(";", ",").split(",") if orig.strip()]
    allowed_origins = list(dict.fromkeys(default_origins + custom_origins))
else:
    allowed_origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

# ─── Build graph on startup ───────────────────────────────────

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

print("[Agastya] Building drainage network for Minto Bridge, Delhi...")
GRAPH = build_graph_from_cache()
print(f"[Agastya] Network loaded: {GRAPH.number_of_nodes()} nodes, {GRAPH.number_of_edges()} edges")


# ─── Endpoints ─────────────────────────────────────────────────

@app.post("/api/simulate", response_model=SimulateResponse)
async def api_simulate(req: SimulateRequest):
    """
    Simulate flood depths for a given rainfall intensity and duration.
    Supports multi-node blockage in choke mode across all 25 nodes.
    """
    depths = simulate(GRAPH, req.rain_mm, req.minutes, blocked_nodes=req.blocked_nodes)
    coords = get_node_coordinates(GRAPH)
    blocked_set = set(req.blocked_nodes)

    nodes = []
    for node_id, depth in depths.items():
        coord = coords.get(node_id, {})
        name_lower = coord.get("name", "").lower()
        if "underpass" in name_lower or "minto bridge" in name_lower or node_id in ("minto_bridge_center", "tilak_bridge"):
            role = "sag"
        elif "hospital" in name_lower or node_id in ("rml_hospital", "lady_hardinge"):
            role = "hospital"
        elif "station" in name_lower or node_id == "ndls_approach":
            role = "railway"
        else:
            role = "junction"

        risk = classify_risk(depth)
        nodes.append(NodeDepth(
            node_id=node_id,
            id=node_id,
            name=coord.get("name", node_id),
            lat=coord.get("lat", 0.0),
            lon=coord.get("lon", 0.0),
            lng=coord.get("lon", 0.0),
            depth_cm=depth,
            depth=depth,
            risk_level=risk,
            risk=risk,
            blocked=node_id in blocked_set,
            role=role,
        ))

    summary = get_flood_summary(depths)

    return SimulateResponse(
        depths=depths,
        nodes=nodes,
        summary=summary,
        rain_mm=req.rain_mm,
        minutes=req.minutes,
    )


@app.post("/api/route", response_model=RouteResponse)
async def api_route(req: RouteRequest):
    """
    Find the shortest safe ambulance route avoiding flooded areas.
    Uses Dijkstra's algorithm with flooded nodes and flooded edges pruned.
    """
    # Single source of truth: use client simulation depths if provided, else compute
    if req.depths and isinstance(req.depths, dict) and len(req.depths) > 0:
        depths = req.depths
    else:
        depths = simulate(GRAPH, req.rain_mm, req.minutes, blocked_nodes=req.blocked_nodes)

    result = safe_route(GRAPH, depths, req.source, req.target, req.threshold_cm)

    # Add coordinates for path visualization
    coords = get_node_coordinates(GRAPH)
    path_coords = []
    for node_id in result["path"]:
        coord = coords.get(node_id, {})
        path_coords.append({
            "node_id": node_id,
            "name": coord.get("name", node_id),
            "lat": coord.get("lat", 0),
            "lon": coord.get("lon", 0),
        })

    return RouteResponse(
        path=result["path"],
        path_coords=path_coords,
        distance_m=result["distance_m"],
        blocked_nodes=result["blocked_nodes"],
        blocked_count=result["blocked_count"],
        eta_normal_sec=result["eta_normal_sec"],
        eta_safe_sec=result["eta_safe_sec"],
        eta_saved_sec=result["eta_saved_sec"],
        detour_delay_sec=result.get("detour_delay_sec", 0.0),
        detour_extra_m=result.get("detour_extra_m", 0.0),
        detour_m=result.get("detour_m", 0.0),
        eta_sec=result.get("eta_sec", 0.0),
        avoided_segments=result.get("avoided_segments", 0),
        reachable=result["reachable"],
        reason=result.get("reason"),
        origin_depth_cm=result.get("origin_depth_cm"),
        destination_depth_cm=result.get("destination_depth_cm"),
        threshold_cm=result.get("threshold_cm", req.threshold_cm),
        message=result["message"],
    )



@app.post("/api/choke", response_model=ChokeResponse)
async def api_choke(req: ChokeRequest):
    """
    Simulate blocking one or multiple manholes and see cascading flood impact.
    Click-to-choke: block nodes → neighbouring roads surcharge and flood more.
    """
    targets = []
    if req.node_id:
        targets.append(req.node_id)
    if req.node_ids:
        targets.extend(req.node_ids)
    targets = list(dict.fromkeys(targets))

    if not targets:
        raise HTTPException(400, "At least one node_id or node_ids must be provided")

    for nid in targets:
        if nid not in GRAPH.nodes:
            raise HTTPException(404, f"Node '{nid}' not found in network")

    result = simulate_choke(GRAPH, node_ids=targets, rain_mm_hr=req.rain_mm, minutes=req.minutes)

    return ChokeResponse(**result)


@app.get("/api/rain/live")
async def api_rain_live():
    """
    Fetch real-time rainfall data for Minto Bridge from Open-Meteo API.
    Falls back to cached data if offline.
    """
    return await fetch_live_rain()


@app.get("/api/network")
async def api_network():
    """
    Return the full drainage network graph for map rendering.
    Includes node coordinates and edge connections.
    """
    return {
        "nodes": get_node_coordinates(GRAPH),
        "edges": get_edge_list(GRAPH),
        "center": {"lat": 28.6280, "lon": 77.2197},
        "zoom": 15,
        "location": "Minto Bridge, New Delhi",
    }


@app.get("/api/pysewer/status")
async def api_pysewer_status():
    """
    Return PySewer library status and topology generation specifications.
    Explains the gravity-driven hydraulic design principles for the Minto Bridge catchment.
    """
    return get_pysewer_status()


@app.post("/api/pysewer/synthesize")
async def api_pysewer_synthesize(design_rain_mm_hr: float = 35.0):
    """
    Execute PySewer gravity layout synthesizer across the road and elevation graph.
    Returns diameter sizing, slopes, and flow capacities compliant with CPHEEO standards.
    """
    return synthesize_sewer_topology(GRAPH, design_rain_mm_hr=design_rain_mm_hr)


@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
async def health():
    """Health check endpoint for Render / UptimeRobot / keep-alive."""
    return HealthResponse()


# ─── Run directly ──────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    is_prod = os.environ.get("ENVIRONMENT", "development").lower() == "production"
    uvicorn.run("main:app", host=host, port=port, reload=not is_prod)
