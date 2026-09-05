"""
Agastya — Choke Simulation: Multi-Node Manhole Blockage Analysis
================================================================
Simulates what happens when one or MORE manholes (nodes) get blocked/clogged.
All connected pipes have their capacity zeroed out, causing
upstream flooding and backwater surcharge to worsen across the network.
"""

from typing import Optional
import networkx as nx
from engine.surcharge import simulate


def choke_nodes(G: nx.Graph, blocked_list: list[str]) -> nx.Graph:
    """
    Block multiple manhole nodes by zeroing all connected pipe diameters.
    """
    G_choked = G.copy()
    blocked_set = set(str(x) for x in blocked_list)

    for node_id in blocked_set:
        if node_id in G_choked.nodes:
            G_choked.nodes[node_id]["blocked"] = True
            for nbr in list(G_choked.neighbors(node_id)):
                G_choked[node_id][nbr]["diameter"] = 0.0

    return G_choked


def simulate_choke(
    G: nx.Graph,
    node_id: Optional[str] = None,
    node_ids: Optional[list[str]] = None,
    rain_mm_hr: float = 50.0,
    minutes: int = 30,
) -> dict:
    """
    Simulate the impact of blocking one or multiple manholes during rainfall.

    Returns:
        Dict with: choked_node, flooded_neighbours, depths_before, depths_after,
        depth_increase for affected neighbours, and total_depth_increase_cm.
    """
    targets = []
    if node_id:
        targets.append(str(node_id))
    if node_ids:
        targets.extend(str(x) for x in node_ids)
    targets = list(dict.fromkeys(targets))  # unique preserving order

    # Depths BEFORE choke
    depths_before = simulate(G, rain_mm_hr, minutes, blocked_nodes=[])

    # Depths AFTER choke with all blocked targets
    depths_after = simulate(G, rain_mm_hr, minutes, blocked_nodes=targets)

    # Find affected neighbours across all blocked targets
    all_affected_nbrs = set()
    for nid in targets:
        if nid in G.nodes:
            all_affected_nbrs.update(G.neighbors(nid))
    # Exclude the blocked nodes themselves from the "neighbours" list
    for nid in targets:
        all_affected_nbrs.discard(nid)

    flooded_neighbours = []
    for nbr in all_affected_nbrs:
        nbr_str = str(nbr)
        before = depths_before.get(nbr_str, 0.0)
        after = depths_after.get(nbr_str, 0.0)
        increase = max(0.0, round(after - before, 2))
        flooded_neighbours.append({
            "node_id": nbr_str,
            "name": G.nodes[nbr].get("name", nbr_str),
            "depth_before_cm": round(before, 2),
            "depth_after_cm": round(after, 2),
            "depth_increase_cm": increase,
            "lat": G.nodes[nbr].get("lat", 0),
            "lon": G.nodes[nbr].get("lon", 0),
        })

    # Primary name
    primary_name = ", ".join(
        [G.nodes[n].get("name", n) for n in targets if n in G.nodes]
    ) if targets else "None"

    return {
        "choked_node": targets[0] if targets else "",
        "choked_name": primary_name,
        "flooded_neighbours": flooded_neighbours,
        "depths_after": depths_after,
        "total_depth_increase_cm": round(
            sum(n["depth_increase_cm"] for n in flooded_neighbours), 2
        ),
    }
