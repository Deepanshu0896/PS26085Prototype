"""
Automated Integration Tests: FastAPI Endpoints
==============================================
Tests all REST endpoints for schema validation, response codes,
and end-to-end simulation workflows using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["project"] == "Agastya"


def test_network_endpoint():
    res = client.get("/api/network")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) == 25
    assert len(data["edges"]) == 39


def test_simulate_endpoint():
    payload = {"rain_mm": 50.0, "minutes": 30, "blocked_nodes": []}
    res = client.post("/api/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "depths" in data
    assert "summary" in data
    assert len(data["nodes"]) == 25
    assert data["summary"]["max_depth_cm"] > 0


def test_simulate_zero_rain():
    payload = {"rain_mm": 0.0, "minutes": 30, "blocked_nodes": []}
    res = client.post("/api/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["max_depth_cm"] == 0.0
    assert data["summary"]["flooded_nodes"] == 0


def test_route_endpoint():
    payload = {
        "source": "cp_outer_n",
        "target": "barakhamba_junction",
        "threshold_cm": 15.0,
        "rain_mm": 35.0,
        "minutes": 30,
        "blocked_nodes": []
    }
    res = client.post("/api/route", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["reachable"] is True
    assert len(data["path"]) >= 2
    assert data["distance_m"] > 0
    assert "eta_safe_sec" in data


def test_choke_endpoint():
    payload = {
        "node_id": "minto_bridge_center",
        "rain_mm": 50.0,
        "minutes": 30,
        "node_ids": []
    }
    res = client.post("/api/choke", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["choked_node"] == "minto_bridge_center"
    assert "flooded_neighbours" in data
    assert len(data["flooded_neighbours"]) > 0


def test_pysewer_endpoints():
    # Status
    res_status = client.get("/api/pysewer/status")
    assert res_status.status_code == 200
    assert "hydraulic_solver" in res_status.json()

    # Synthesize
    res_synth = client.post("/api/pysewer/synthesize?design_rain_mm_hr=35.0")
    assert res_synth.status_code == 200
    synth_data = res_synth.json()
    assert synth_data["status"] == "success"
    assert synth_data["total_pipes"] == 39


def test_rain_live_endpoint():
    res = client.get("/api/rain/live")
    assert res.status_code == 200
    data = res.json()
    assert "location" in data
    assert "hourly_forecast" in data
