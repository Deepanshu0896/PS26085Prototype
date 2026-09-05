"""
Automated Unit Tests: Safe Ambulance Routing & Dijkstra Corridor
================================================================
Comprehensive tests for:
1. origin depth > 15 cm (ORIGIN_UNSAFE)
2. destination depth > 15 cm (DESTINATION_UNSAFE)
3. both origin and destination > 15 cm
4. origin == destination (SAME_ORIGIN_DESTINATION)
5. origin missing (INVALID_ORIGIN)
6. destination missing (INVALID_DESTINATION)
7. endpoint depth missing from dictionary (ENDPOINT_DEPTH_UNAVAILABLE)
8. no safe route (NO_SAFE_ROUTE)
9. all intermediate roads flooded
10. flooded edge pruned
11. route after rainfall change
12. route after choke
13. route after unblock and reset
"""

import pytest
from engine.graph_build import build_graph_from_cache
from engine.surcharge import simulate
from routing.safe_route import safe_route


@pytest.fixture
def graph():
    return build_graph_from_cache()


def test_dry_routing_shortest_path(graph):
    """Under dry conditions (rain=0), ambulance uses direct shortest path."""
    depths = simulate(graph, rain_mm_hr=0.0, minutes=30)
    res = safe_route(
        graph,
        depths,
        source="cp_outer_n",
        target="barakhamba_junction",
        threshold_cm=15.0
    )

    assert res["reachable"] is True
    assert len(res["path"]) >= 2
    assert res["distance_m"] > 0
    assert len(res["blocked_nodes"]) == 0
    assert res["eta_safe_sec"] > 0
    assert res["origin_depth_cm"] == 0.0
    assert res["destination_depth_cm"] == 0.0


def test_1_origin_depth_greater_than_15(graph):
    """Case 1: Origin depth > 15 cm returns unreachable with ORIGIN_UNSAFE."""
    synthetic_depths = {n: 2.0 for n in graph.nodes}
    synthetic_depths["cp_outer_n"] = 28.5

    res = safe_route(graph, synthetic_depths, source="cp_outer_n", target="barakhamba_junction", threshold_cm=15.0)

    assert res["reachable"] is False
    assert res["reason"] == "ORIGIN_UNSAFE"
    assert res["path"] == []
    assert res["origin_depth_cm"] == 28.5
    assert res["destination_depth_cm"] == 2.0
    assert "submerged" in res["message"].lower() or "cannot safely deploy" in res["message"].lower()


def test_2_destination_depth_greater_than_15(graph):
    """Case 2: Destination depth > 15 cm returns unreachable with DESTINATION_UNSAFE."""
    synthetic_depths = {n: 2.0 for n in graph.nodes}
    synthetic_depths["barakhamba_junction"] = 32.0

    res = safe_route(graph, synthetic_depths, source="cp_outer_n", target="barakhamba_junction", threshold_cm=15.0)

    assert res["reachable"] is False
    assert res["reason"] == "DESTINATION_UNSAFE"
    assert res["path"] == []
    assert res["origin_depth_cm"] == 2.0
    assert res["destination_depth_cm"] == 32.0
    assert "submerged" in res["message"].lower() or "inaccessible" in res["message"].lower()


def test_3_both_origin_and_destination_greater_than_15(graph):
    """Case 3: Both endpoints > 15 cm returns ORIGIN_UNSAFE as primary blocker before Dijkstra."""
    synthetic_depths = {n: 2.0 for n in graph.nodes}
    synthetic_depths["cp_outer_n"] = 24.0
    synthetic_depths["barakhamba_junction"] = 30.0

    res = safe_route(graph, synthetic_depths, source="cp_outer_n", target="barakhamba_junction", threshold_cm=15.0)

    assert res["reachable"] is False
    assert res["reason"] == "ORIGIN_UNSAFE"
    assert res["path"] == []
    assert res["origin_depth_cm"] == 24.0
    assert res["destination_depth_cm"] == 30.0


def test_4_origin_equals_destination(graph):
    """Case 4: Origin equals destination returns SAME_ORIGIN_DESTINATION."""
    synthetic_depths = {n: 2.0 for n in graph.nodes}

    res = safe_route(graph, synthetic_depths, source="cp_outer_n", target="cp_outer_n", threshold_cm=15.0)

    assert res["reachable"] is True
    assert res["reason"] == "SAME_ORIGIN_DESTINATION"
    assert res["path"] == ["cp_outer_n"]
    assert res["distance_m"] == 0.0


def test_5_origin_missing_from_graph(graph):
    """Case 5: Origin missing returns structured error with INVALID_ORIGIN."""
    synthetic_depths = {n: 2.0 for n in graph.nodes}

    res = safe_route(graph, synthetic_depths, source="unknown_node_xyz", target="barakhamba_junction")

    assert res["reachable"] is False
    assert res["reason"] == "INVALID_ORIGIN"
    assert res["path"] == []


def test_6_destination_missing_from_graph(graph):
    """Case 6: Destination missing returns structured error with INVALID_DESTINATION."""
    synthetic_depths = {n: 2.0 for n in graph.nodes}

    res = safe_route(graph, synthetic_depths, source="cp_outer_n", target="unknown_dest_abc")

    assert res["reachable"] is False
    assert res["reason"] == "INVALID_DESTINATION"
    assert res["path"] == []


def test_7_endpoint_missing_from_depths_never_defaults_to_zero(graph):
    """Case 7: Endpoint missing from depths dict fails with ENDPOINT_DEPTH_UNAVAILABLE."""
    partial_depths = {"barakhamba_junction": 2.0}  # "cp_outer_n" missing

    res = safe_route(graph, partial_depths, source="cp_outer_n", target="barakhamba_junction", threshold_cm=15.0)

    assert res["reachable"] is False
    assert res["reason"] == "ENDPOINT_DEPTH_UNAVAILABLE"
    assert "unavailable" in res["message"].lower()


def test_8_no_safe_route_disconnected(graph):
    """Case 8: Corridors submerged yields NO_SAFE_ROUTE."""
    synthetic_depths = {n: 25.0 for n in graph.nodes}
    synthetic_depths["cp_outer_n"] = 2.0
    synthetic_depths["barakhamba_junction"] = 2.0

    res = safe_route(graph, synthetic_depths, source="cp_outer_n", target="barakhamba_junction", threshold_cm=15.0)

    assert res["reachable"] is False
    assert res["reason"] == "NO_SAFE_ROUTE"
    assert len(res["path"]) == 0


def test_9_all_intermediate_roads_flooded(graph):
    """Case 9: All intermediate roads flooded triggers detour avoidance."""
    depths = simulate(graph, rain_mm_hr=75.0, minutes=30)
    assert depths["minto_bridge_center"] > 15.0

    res = safe_route(graph, depths, source="cp_outer_n", target="kg_marg_east", threshold_cm=15.0)
    if res["reachable"]:
        assert "minto_bridge_center" not in res["path"]
        assert "minto_bridge_center" in res["blocked_nodes"]


def test_10_flooded_edge_pruned(graph):
    """Case 10: Flooded edge (max(u,v) > 15) is pruned from routing graph."""
    synthetic_depths = {n: 2.0 for n in graph.nodes}
    synthetic_depths["minto_bridge_center"] = 40.0

    res = safe_route(graph, synthetic_depths, source="cp_outer_n", target="barakhamba_junction", threshold_cm=15.0)
    if res["reachable"]:
        assert "minto_bridge_center" not in res["path"]


def test_11_route_after_rainfall_change(graph):
    """Case 11: Route recomputation after rainfall changes reflects fresh depths."""
    dry_depths = simulate(graph, rain_mm_hr=0.0, minutes=30)
    res_dry = safe_route(graph, dry_depths, source="minto_bridge_center", target="barakhamba_junction")
    assert res_dry["reachable"] is True

    # After extreme rain, minto_bridge_center depth exceeds 15 cm
    downpour_depths = simulate(graph, rain_mm_hr=75.0, minutes=30)
    assert downpour_depths["minto_bridge_center"] > 15.0
    res_downpour = safe_route(graph, downpour_depths, source="minto_bridge_center", target="barakhamba_junction")
    assert res_downpour["reachable"] is False
    assert res_downpour["reason"] == "ORIGIN_UNSAFE"


def test_12_route_after_choke(graph):
    """Case 12: Route recomputation after a choke surcharges nodes and updates routing."""
    baseline = simulate(graph, rain_mm_hr=40.0, minutes=30, blocked_nodes=[])
    choked = simulate(graph, rain_mm_hr=40.0, minutes=30, blocked_nodes=["minto_bridge_center", "ddu_marg_west"])

    res_base = safe_route(graph, baseline, source="cp_outer_n", target="barakhamba_junction")
    res_choked = safe_route(graph, choked, source="cp_outer_n", target="barakhamba_junction")

    assert res_base["reachable"] is True
    assert res_choked["reachable"] is True


def test_13_route_after_unblock_and_reset(graph):
    """Case 13: Route after unblocking / clearing chokes deterministically restores baseline route."""
    baseline = simulate(graph, rain_mm_hr=35.0, minutes=30, blocked_nodes=[])
    choked = simulate(graph, rain_mm_hr=35.0, minutes=30, blocked_nodes=["minto_bridge_center"])
    cleared = simulate(graph, rain_mm_hr=35.0, minutes=30, blocked_nodes=[])

    res_base = safe_route(graph, baseline, source="cp_outer_n", target="barakhamba_junction")
    res_cleared = safe_route(graph, cleared, source="cp_outer_n", target="barakhamba_junction")

    assert res_base["path"] == res_cleared["path"]
    assert res_base["distance_m"] == res_cleared["distance_m"]
