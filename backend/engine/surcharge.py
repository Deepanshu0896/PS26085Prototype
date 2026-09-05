"""
Agastya — Surcharge Model: Street Flood Depth Calculator
========================================================
When rainfall inflow exceeds pipe capacity, excess water surcharges
onto the road surface. This module computes the flood depth (cm)
at each node (manhole/intersection) in the drainage network.

Hydrological model features:
  1. Rational Method inflow: Q = C * I * A (impervious runoff C = 0.85)
  2. Storm Duration Accumulation: Inundation scales with rain duration (minutes)
  3. Multi-Node Choke Support: Zeroes drainage capacity for all blocked nodes
     and models upstream backwater restriction
  4. Directional hydraulic pipe conveyance based on DEM slope
  5. Sag / Depression cascade: low elevation points (e.g. Minto Bridge Underpass)
     accumulate surface runoff from upstream sloping street segments
  6. Surcharge depth (cm) = excess_volume / effective_ponding_area * 100
"""

import math
from typing import Optional
import networkx as nx
from engine.capacity import pipe_capacity


def simulate(
    G: nx.Graph,
    rain_mm_hr: float,
    minutes: int = 30,
    duration_factor: float = 1.0,
    blocked_nodes: Optional[list[str]] = None,
) -> dict[str, float]:
    """
    Simulate flood depths at each node for a given rainfall intensity and duration.

    Args:
        G: NetworkX graph representing the drainage network (25 nodes).
        rain_mm_hr: Rainfall intensity in mm/hr (0 to 150+).
        minutes: Duration of the rain storm in minutes (e.g., 5 to 180 min).
        duration_factor: Multiplier for calibration.
        blocked_nodes: List of choked/blocked node IDs.

    Returns:
        Dict mapping node_id (str) -> flood depth in cm.
        Invariant: set(depth_cm.keys()) == set(str(n) for n in G.nodes)
    """
    depth_cm = {}
    blocked_set = set(str(x) for x in (blocked_nodes or []))

    # Invariant 1: Zero rain produces strictly 0.0 cm depth across ALL nodes in the network
    if rain_mm_hr <= 0:
        for n in G.nodes:
            depth_cm[str(n)] = 0.0
        return depth_cm

    # Impervious urban surface runoff coefficient (CPHEEO manual C = 0.85 for Delhi core)
    runoff_coeff = 0.85

    # Step 1: Calculate direct surface runoff inflow at each of the 25 nodes (m³/s)
    # Rational Formula: Q_in = C * (I * 10^-3 / 3600) * A_m2
    node_inflows: dict[str, float] = {}
    for n in G.nodes:
        n_str = str(n)
        node_data = G.nodes[n]
        catch_area = float(node_data.get("catch_area", 2500.0))  # m²
        inflow = runoff_coeff * (rain_mm_hr * 1e-3 / 3600.0) * catch_area
        node_inflows[n_str] = inflow

    # Step 2: Compute outgoing drainage capacity for each node based on Delhi design standards
    # CPHEEO urban drainage design standard for Delhi is 15-20 mm/hr storm conveyance.
    # When rainfall exceeds this design threshold, street drains surcharge.
    node_excess: dict[str, float] = {}
    for n in G.nodes:
        n_str = str(n)
        node_data = G.nodes[n]
        is_blocked = (n_str in blocked_set) or bool(node_data.get("blocked", False))
        elev_n = float(node_data.get("elevation", 214.0))
        catch_area = float(node_data.get("catch_area", 2500.0))

        if is_blocked:
            # Choked manhole: zero drainage intake capacity
            downstream_capacity = 0.0
        else:
            # Baseline conduit conveyance capacity (Delhi CPHEEO design allowance ~18 mm/hr)
            # Q_design = C * (18 * 1e-3 / 3600) * catch_area ≈ 0.0042 m³/s per 1000 m²
            base_drain_rate = runoff_coeff * (18.0 * 1e-3 / 3600.0) * catch_area

            # Evaluate physical pipe outflow to downhill neighbors
            gravity_pipe_cap = 0.0
            for nbr in G.neighbors(n):
                nbr_str = str(nbr)
                if nbr_str in blocked_set:
                    continue  # Downstream pipe blocked

                nbr_data = G.nodes[nbr]
                elev_nbr = float(nbr_data.get("elevation", 214.0))
                edge = G[n][nbr]
                diameter = float(edge.get("diameter", 0.45))
                length = max(float(edge.get("length", 50.0)), 1.0)
                roughness = float(edge.get("roughness", 0.013))

                if elev_n > elev_nbr:
                    slope = (elev_n - elev_nbr) / length
                    q_cap = pipe_capacity(diameter, length, slope, roughness)
                    gravity_pipe_cap += q_cap
                elif abs(elev_n - elev_nbr) < 0.1:
                    q_cap = pipe_capacity(diameter, length, 0.001, roughness) * 0.3
                    gravity_pipe_cap += q_cap

            # Net drainage capacity is governed by street inlet grating capacity
            # An urban catch-basin intake throttles flow into pipes
            downstream_capacity = min(base_drain_rate, max(gravity_pipe_cap, 0.001))

        # Direct surcharge rate at this node (m³/s)
        excess = max(0.0, node_inflows[n_str] - downstream_capacity)
        if is_blocked:
            excess = node_inflows[n_str]  # All inflow surcharges onto road

        node_excess[n_str] = excess

    # Step 3: Overland runoff cascade toward topographic depressions
    # Runoff cascades downhill towards lower elevations (especially Minto Bridge Underpass at 210.5m)
    cascaded_excess = dict(node_excess)
    for n in G.nodes:
        n_str = str(n)
        elev_n = float(G.nodes[n].get("elevation", 214.0))
        for nbr in G.neighbors(n):
            nbr_str = str(nbr)
            elev_nbr = float(G.nodes[nbr].get("elevation", 214.0))
            if elev_nbr > elev_n + 0.2:
                elevation_diff = elev_nbr - elev_n
                # Steeper elevation drop funnels a higher fraction of sheet flow downhill
                if elevation_diff >= 2.0:
                    transfer = (node_inflows[nbr_str] * 0.25) + (node_excess[nbr_str] * 0.35)
                else:
                    transfer = node_excess[nbr_str] * min(0.30, 0.12 * elevation_diff)

                cascaded_excess[n_str] += transfer
                cascaded_excess[nbr_str] = max(0.0005, cascaded_excess[nbr_str] - transfer * 0.3)

    # Step 4: Identify upstream neighbors of blocked nodes for hydraulic backwater surcharge
    upstream_blocked_nbrs: set[str] = set()
    for b_node in blocked_set:
        if b_node in G.nodes:
            elev_b = float(G.nodes[b_node].get("elevation", 214.0))
            for nbr in G.neighbors(b_node):
                nbr_str = str(nbr)
                if nbr_str not in blocked_set and float(G.nodes[nbr].get("elevation", 214.0)) >= elev_b:
                    upstream_blocked_nbrs.add(nbr_str)

    # Step 5: Convert accumulated excess volume to road flood depth (cm)
    effective_seconds = max(minutes, 5) * 60.0

    for n in G.nodes:
        n_str = str(n)
        node_data = G.nodes[n]
        name = str(node_data.get("name", "")).lower()
        is_underpass = ("underpass" in name or "minto bridge" in name or n_str == "minto_bridge_center")

        # Standard roadway ponding surface area (m²)
        # Underpass sag roadway bowl is ~650 m² (4 traffic lanes x 45 m length)
        catch_area = float(node_data.get("catch_area", 2500.0))
        ponding_area = 650.0 if is_underpass else max(catch_area * 0.40, 600.0)

        net_excess_rate = cascaded_excess[n_str]
        # Underpass sump pump baseline allowance (~0.015 m³/s)
        if is_underpass and net_excess_rate > 0.020:
            net_excess_rate = net_excess_rate - 0.015

        excess_vol = max(0.0, net_excess_rate) * effective_seconds * duration_factor

        # Street surface flood depth in cm
        depth = (excess_vol / ponding_area) * 100.0

        # Minimum gutter sheet-flow during sustained rainfall
        # (Water film & gutter flow across asphalt road surface, 1.5 - 4 cm depending on rain intensity)
        if rain_mm_hr > 0 and depth < 2.0:
            sheet_flow = min(3.5, 1.2 * (rain_mm_hr / 25.0) * min(1.0, minutes / 20.0))
            depth = max(depth, sheet_flow)

        # Dynamic backwater surcharge for blocked nodes & their upstream conduits
        if n_str in blocked_set:
            base_backwater = 12.0 * (rain_mm_hr / 50.0) * (minutes / 30.0)
            depth += max(base_backwater, 4.0)
        elif n_str in upstream_blocked_nbrs:
            upstream_backwater = 5.5 * (rain_mm_hr / 50.0) * (minutes / 30.0)
            depth += max(upstream_backwater, 2.0)

        depth_cm[n_str] = round(max(0.0, depth), 1)

    return depth_cm




def classify_risk(depth_cm: float) -> str:
    """Classify flood risk based on water depth."""
    if depth_cm >= 30:
        return "CRITICAL"
    elif depth_cm >= 20:
        return "HIGH"
    elif depth_cm >= 10:
        return "MEDIUM"
    elif depth_cm >= 3:
        return "LOW"
    else:
        return "SAFE"


def get_flood_summary(depths: dict[str, float]) -> dict:
    """
    Generate summary statistics from flood simulation results.

    Returns:
        Dict with: total_nodes, flooded_nodes, max_depth, avg_depth,
        risk_breakdown (count per risk level).
    """
    values = list(depths.values())
    flooded = [d for d in values if d >= 3.0]

    risk_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "SAFE": 0}
    for d in values:
        risk_counts[classify_risk(d)] += 1

    return {
        "total_nodes": len(values),
        "flooded_nodes": len(flooded),
        "max_depth_cm": round(max(values), 1) if values else 0,
        "avg_depth_cm": round(sum(values) / len(values), 1) if values else 0,
        "avg_flooded_depth_cm": round(sum(flooded) / len(flooded), 1) if flooded else 0,
        "risk_breakdown": risk_counts,
    }
