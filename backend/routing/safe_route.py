"""
Agastya — Safe Ambulance Route: Dijkstra with Flooded Node Avoidance
====================================================================
Computes the shortest safe path for ambulances by removing
flooded nodes (depth > threshold) from the road graph and
running Dijkstra's shortest path algorithm.
"""

import networkx as nx


def safe_route(
    road_G: nx.Graph,
    depth_cm: dict[str, float],
    source: str,
    target: str,
    threshold_cm: float = 15.0,
) -> dict:
    """
    Find the shortest safe route avoiding flooded areas.

    Args:
        road_G: NetworkX graph of the road network (25 nodes).
        depth_cm: Dict mapping node_id → flood depth in cm.
        source: Start node ID.
        target: Destination node ID.
        threshold_cm: Maximum safe water depth in cm (default 15.0 cm).

    Returns:
        Dict with: reachable, reason, path, distance_m, blocked_nodes,
        blocked_count, eta_normal_sec, eta_safe_sec, eta_sec, eta_saved_sec,
        detour_delay_sec, detour_extra_m, detour_m, avoided_segments, message.
    """
    source = str(source)
    target = str(target)

    # Check 1: Invalid source node
    if source not in road_G.nodes:
        return {
            "path": [],
            "distance_m": 0.0,
            "blocked_nodes": [],
            "blocked_count": 0,
            "eta_normal_sec": 0.0,
            "eta_safe_sec": 0.0,
            "eta_sec": 0.0,
            "eta_saved_sec": 0.0,
            "detour_delay_sec": 0.0,
            "detour_extra_m": 0.0,
            "detour_m": 0.0,
            "avoided_segments": 0,
            "reachable": False,
            "reason": "INVALID_ORIGIN",
            "origin_depth_cm": None,
            "destination_depth_cm": depth_cm.get(target) if target in depth_cm else None,
            "threshold_cm": threshold_cm,
            "message": f"Origin node '{source}' does not exist in the catchment network.",
        }

    # Check 2: Invalid target node
    if target not in road_G.nodes:
        return {
            "path": [],
            "distance_m": 0.0,
            "blocked_nodes": [],
            "blocked_count": 0,
            "eta_normal_sec": 0.0,
            "eta_safe_sec": 0.0,
            "eta_sec": 0.0,
            "eta_saved_sec": 0.0,
            "detour_delay_sec": 0.0,
            "detour_extra_m": 0.0,
            "detour_m": 0.0,
            "avoided_segments": 0,
            "reachable": False,
            "reason": "INVALID_DESTINATION",
            "origin_depth_cm": depth_cm.get(source) if source in depth_cm else None,
            "destination_depth_cm": None,
            "threshold_cm": threshold_cm,
            "message": f"Destination node '{target}' does not exist in the catchment network.",
        }

    # Check 3: Depth availability validation (Never silently default missing endpoint depth to 0)
    if source not in depth_cm or target not in depth_cm:
        missing = []
        if source not in depth_cm:
            missing.append(f"origin '{source}'")
        if target not in depth_cm:
            missing.append(f"destination '{target}'")
        return {
            "path": [],
            "distance_m": 0.0,
            "blocked_nodes": [],
            "blocked_count": 0,
            "eta_normal_sec": 0.0,
            "eta_safe_sec": 0.0,
            "eta_sec": 0.0,
            "eta_saved_sec": 0.0,
            "detour_delay_sec": 0.0,
            "detour_extra_m": 0.0,
            "detour_m": 0.0,
            "avoided_segments": 0,
            "reachable": False,
            "reason": "ENDPOINT_DEPTH_UNAVAILABLE",
            "origin_depth_cm": depth_cm.get(source),
            "destination_depth_cm": depth_cm.get(target),
            "threshold_cm": threshold_cm,
            "message": f"Simulation depth unavailable for {', '.join(missing)} in current simulation state.",
        }

    source_depth = float(depth_cm[source])
    target_depth = float(depth_cm[target])

    # Check 4: Origin flood safety clearance (MUST happen BEFORE Dijkstra)
    if source_depth > threshold_cm:
        return {
            "path": [],
            "distance_m": 0.0,
            "blocked_nodes": [source],
            "blocked_count": 1,
            "eta_normal_sec": 0.0,
            "eta_safe_sec": 0.0,
            "eta_sec": 0.0,
            "eta_saved_sec": 0.0,
            "detour_delay_sec": 0.0,
            "detour_extra_m": 0.0,
            "detour_m": 0.0,
            "avoided_segments": 1,
            "reachable": False,
            "reason": "ORIGIN_UNSAFE",
            "origin_depth_cm": round(source_depth, 1),
            "destination_depth_cm": round(target_depth, 1),
            "threshold_cm": threshold_cm,
            "message": (
                f"Dispatch origin '{source}' is submerged ({source_depth:.1f} cm > {threshold_cm:.0f} cm threshold). "
                f"Ambulance cannot safely deploy from this location."
            ),
        }

    # Check 5: Destination flood safety clearance (MUST happen BEFORE Dijkstra)
    if target_depth > threshold_cm:
        return {
            "path": [],
            "distance_m": 0.0,
            "blocked_nodes": [target],
            "blocked_count": 1,
            "eta_normal_sec": 0.0,
            "eta_safe_sec": 0.0,
            "eta_sec": 0.0,
            "eta_saved_sec": 0.0,
            "detour_delay_sec": 0.0,
            "detour_extra_m": 0.0,
            "detour_m": 0.0,
            "avoided_segments": 1,
            "reachable": False,
            "reason": "DESTINATION_UNSAFE",
            "origin_depth_cm": round(source_depth, 1),
            "destination_depth_cm": round(target_depth, 1),
            "threshold_cm": threshold_cm,
            "message": (
                f"Destination '{target}' is submerged ({target_depth:.1f} cm > {threshold_cm:.0f} cm threshold). "
                f"Emergency facility/exit is currently inaccessible."
            ),
        }

    # Check 6: Source equals target
    if source == target:
        return {
            "path": [source],
            "distance_m": 0.0,
            "blocked_nodes": [],
            "blocked_count": 0,
            "eta_normal_sec": 0.0,
            "eta_safe_sec": 0.0,
            "eta_sec": 0.0,
            "eta_saved_sec": 0.0,
            "detour_delay_sec": 0.0,
            "detour_extra_m": 0.0,
            "detour_m": 0.0,
            "avoided_segments": 0,
            "reachable": True,
            "reason": "SAME_ORIGIN_DESTINATION",
            "origin_depth_cm": round(source_depth, 1),
            "destination_depth_cm": round(target_depth, 1),
            "threshold_cm": threshold_cm,
            "message": "Origin and destination are identical.",
        }

    # Build safe subgraph: clone baseline road network
    G = road_G.copy()

    # Identify and remove flooded intermediate nodes
    blocked_nodes = []
    for n, d in depth_cm.items():
        if d > threshold_cm and n in G.nodes:
            if n != source and n != target:
                blocked_nodes.append(str(n))
                G.remove_node(n)

    # Edge-level safety: remove road segments where either endpoint is inundated
    pruned_edges = []
    edges_to_remove = []
    for u, v in G.edges():
        u_d = depth_cm.get(str(u), 0.0)
        v_d = depth_cm.get(str(v), 0.0)
        edge_depth = max(u_d, v_d)
        if edge_depth > threshold_cm:
            edges_to_remove.append((u, v))
            pruned_edges.append((str(u), str(v)))

    for u, v in edges_to_remove:
        if G.has_edge(u, v):
            G.remove_edge(u, v)

    # Normal baseline route (ignoring flood depths) for benchmark comparison
    try:
        normal_distance = nx.shortest_path_length(road_G, source, target, weight="length")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        normal_distance = 0.0

    try:
        # Dijkstra shortest path on safe subgraph
        safe_path = nx.shortest_path(G, source, target, weight="length")
        safe_distance = nx.shortest_path_length(G, source, target, weight="length")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return {
            "path": [],
            "distance_m": 0.0,
            "blocked_nodes": blocked_nodes,
            "blocked_count": len(blocked_nodes),
            "eta_normal_sec": 0.0,
            "eta_safe_sec": 0.0,
            "eta_sec": 0.0,
            "eta_saved_sec": 0.0,
            "detour_delay_sec": 0.0,
            "detour_extra_m": 0.0,
            "detour_m": 0.0,
            "avoided_segments": len(blocked_nodes) + len(pruned_edges),
            "reachable": False,
            "reason": "NO_SAFE_ROUTE",
            "origin_depth_cm": round(source_depth, 1),
            "destination_depth_cm": round(target_depth, 1),
            "threshold_cm": threshold_cm,
            "message": (
                f"No safe route found from {source} to {target}. "
                f"All connecting road corridors exceed vehicle water clearance ({threshold_cm:.0f} cm)."
            ),
        }

    # Vehicle drive speed (urban Delhi ambulance avg ~30 km/h = ~8.33 m/s)
    speed_mps = 30.0 * 1000.0 / 3600.0  # ~8.33 m/s
    eta_normal = (normal_distance / speed_mps) if normal_distance > 0 else (safe_distance / speed_mps)
    eta_safe = safe_distance / speed_mps
    detour_delay = max(0.0, eta_safe - eta_normal)
    detour_extra = max(0.0, safe_distance - normal_distance) if normal_distance > 0 else 0.0

    return {
        "path": [str(n) for n in safe_path],
        "distance_m": round(safe_distance, 1),
        "blocked_nodes": blocked_nodes,
        "blocked_count": len(blocked_nodes),
        "eta_normal_sec": round(eta_normal, 1),
        "eta_safe_sec": round(eta_safe, 1),
        "eta_sec": round(eta_safe, 1),
        "eta_saved_sec": round(detour_delay, 1),
        "detour_delay_sec": round(detour_delay, 1),
        "detour_extra_m": round(detour_extra, 1),
        "detour_m": round(detour_extra, 1),
        "avoided_segments": len(blocked_nodes) + len(pruned_edges),
        "reachable": True,
        "reason": "ROUTE_FOUND",
        "origin_depth_cm": round(source_depth, 1),
        "destination_depth_cm": round(target_depth, 1),
        "threshold_cm": threshold_cm,
        "message": (
            f"Safe route computed avoiding {len(blocked_nodes)} inundated road segments "
            f"(clearance threshold {threshold_cm:.0f} cm)."
        ),
    }



def get_all_routes_from(
    road_G: nx.Graph,
    depth_cm: dict[str, float],
    source: str,
    threshold_cm: float = 15.0,
) -> dict[str, dict]:
    """
    Compute safe routes from a source to all reachable hospitals/landmarks.
    """
    hospital_nodes = ["rml_hospital", "lady_hardinge"]
    routes = {}
    for target in hospital_nodes:
        if target in road_G.nodes and target != source:
            routes[target] = safe_route(road_G, depth_cm, source, target, threshold_cm)
    return routes
