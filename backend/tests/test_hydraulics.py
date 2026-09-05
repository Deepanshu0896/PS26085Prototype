"""
Automated Unit Tests: Hydraulic Engine, Surcharge & Choke Modeling
===================================================================
Tests core hydrology formulas, Manning pipe capacity, Rational runoff,
storm duration accumulation, and multi-node choke backwater dynamics.
"""

import pytest
import networkx as nx
from engine.graph_build import build_graph_from_cache
from engine.capacity import pipe_capacity, pipe_velocity, batch_capacity
from engine.surcharge import simulate, classify_risk, get_flood_summary
from routing.choke import simulate_choke


@pytest.fixture
def graph():
    """Load the pre-cached 25-node Minto Bridge catchment graph."""
    return build_graph_from_cache()


def test_zero_rain_zero_depth(graph):
    """Test 1: Zero rainfall must yield strictly 0.0 cm flood depth everywhere."""
    depths = simulate(graph, rain_mm_hr=0.0, minutes=30)
    assert len(depths) == graph.number_of_nodes()
    for node, depth in depths.items():
        assert depth == 0.0, f"Node {node} had non-zero depth {depth} during zero rain"

    # Even if nodes are marked as choked on a dry day, depth must remain 0.0
    depths_choked = simulate(graph, rain_mm_hr=0.0, minutes=30, blocked_nodes=["minto_bridge_center"])
    for node, depth in depths_choked.items():
        assert depth == 0.0, f"Node {node} had depth {depth} during dry choke"


def test_pipe_capacity_positive():
    """Test 2: Manning pipe capacity calculation produces positive physical flow."""
    # Standard 450 mm concrete stormwater pipe on 0.5% slope
    q = pipe_capacity(diameter_m=0.45, length_m=50.0, slope=0.005, roughness=0.013)
    assert q > 0.0, "Pipe capacity must be positive"
    assert 0.1 < q < 1.0, f"Expected capacity around 0.15-0.30 m3/s, got {q}"

    # Invalid diameter produces zero capacity
    assert pipe_capacity(diameter_m=0.0, length_m=50.0, slope=0.005) == 0.0

    # Velocity calculation
    vel = pipe_velocity(diameter_m=0.45, flow_m3s=q)
    assert vel > 0.6, f"Velocity {vel} m/s should satisfy self-cleansing threshold"


def test_heavy_rain_higher_depth(graph):
    """Test 3: Heavy rain (75 mm/hr) must produce strictly greater inundation than moderate rain (35 mm/hr)."""
    depths_mod = simulate(graph, rain_mm_hr=35.0, minutes=30)
    depths_heavy = simulate(graph, rain_mm_hr=75.0, minutes=30)

    summary_mod = get_flood_summary(depths_mod)
    summary_heavy = get_flood_summary(depths_heavy)

    assert summary_heavy["max_depth_cm"] > summary_mod["max_depth_cm"]
    assert summary_heavy["avg_depth_cm"] > summary_mod["avg_depth_cm"]
    assert summary_heavy["flooded_nodes"] >= summary_mod["flooded_nodes"]

    # Minto Bridge underpass low point
    assert depths_heavy["minto_bridge_center"] > depths_mod["minto_bridge_center"]


def test_duration_scaling_accumulation(graph):
    """Test 4: Storm duration scaling (60 min vs 15 min at 60 mm/hr)."""
    depths_15m = simulate(graph, rain_mm_hr=60.0, minutes=15)
    depths_60m = simulate(graph, rain_mm_hr=60.0, minutes=60)

    max_15m = max(depths_15m.values())
    max_60m = max(depths_60m.values())

    assert max_60m > max_15m, f"60m max depth ({max_60m}cm) must exceed 15m max depth ({max_15m}cm)"
    assert depths_60m["minto_bridge_center"] > depths_15m["minto_bridge_center"]


def test_single_node_choke_impact(graph):
    """Test 5: Choking a drainage node increases local and upstream flood depth."""
    res = simulate_choke(graph, node_id="minto_bridge_center", rain_mm_hr=50.0, minutes=30)

    assert res["choked_node"] == "minto_bridge_center"
    assert len(res["flooded_neighbours"]) > 0
    assert res["total_depth_increase_cm"] > 0.0

    # Ensure blocked node itself experiences surcharge
    baseline = simulate(graph, rain_mm_hr=50.0, minutes=30, blocked_nodes=[])
    choked = simulate(graph, rain_mm_hr=50.0, minutes=30, blocked_nodes=["minto_bridge_center"])
    assert choked["minto_bridge_center"] > baseline["minto_bridge_center"]


def test_multi_node_choke_accumulation(graph):
    """Test 6: Multiple choked nodes accumulate impact across the network."""
    single = simulate_choke(graph, node_ids=["minto_bridge_center"], rain_mm_hr=50.0, minutes=30)
    multi = simulate_choke(
        graph,
        node_ids=["minto_bridge_center", "ddu_marg_west"],
        rain_mm_hr=50.0,
        minutes=30
    )

    assert len(multi["flooded_neighbours"]) >= len(single["flooded_neighbours"])
    assert multi["total_depth_increase_cm"] >= single["total_depth_increase_cm"]


def test_minto_underpass_sag_concentration(graph):
    """Test: Low sag point (Minto Bridge at 210.5m) accumulates overland cascade from surrounding ridges."""
    depths = simulate(graph, rain_mm_hr=50.0, minutes=30)
    minto_depth = depths["minto_bridge_center"]
    cp_depth = depths["cp_outer_n"]  # Ridge at 216.5m
    barakhamba_depth = depths["barakhamba_junction"]  # Ridge at 215.0m

    assert minto_depth > cp_depth, f"Minto underpass ({minto_depth}cm) must exceed CP ridge ({cp_depth}cm)"
    assert minto_depth > barakhamba_depth


def test_risk_classification():
    """Test: Risk category thresholds."""
    assert classify_risk(0.0) == "SAFE"
    assert classify_risk(2.5) == "SAFE"
    assert classify_risk(5.0) == "LOW"
    assert classify_risk(12.0) == "MEDIUM"
    assert classify_risk(22.0) == "HIGH"
    assert classify_risk(35.0) == "CRITICAL"
