"""
Agastya — Manning's Equation: Pipe Capacity Calculator
=====================================================
Computes the maximum flow capacity (Q_cap) of a drainage pipe
using Manning's equation for open-channel / full-pipe flow.

Manning's Formula:  Q = (1/n) * A * R_h^(2/3) * S^(1/2)
Where:
  n   = Manning's roughness coefficient (dimensionless)
  A   = Cross-sectional area of flow (m²)
  R_h = Hydraulic radius = A / P (m)
  P   = Wetted perimeter (m)
  S   = Slope of the pipe (m/m)
  Q   = Flow rate (m³/s)
"""

import math
from typing import Optional


def pipe_capacity(
    diameter_m: float,
    length_m: float,
    slope: float,
    roughness: float = 0.013,
) -> float:
    """
    Calculate full-pipe flow capacity using Manning's equation.

    Args:
        diameter_m: Internal pipe diameter in meters (e.g., 0.3 for 300mm).
        length_m: Pipe length in meters (used for context, not directly in Manning's).
        slope: Hydraulic slope (m/m). Derived from DEM elevation difference / pipe length.
        roughness: Manning's roughness coefficient. Default 0.013 (concrete pipe).

    Returns:
        Maximum flow capacity in m³/s.
    """
    if diameter_m <= 0:
        return 0.0

    r = diameter_m / 2.0  # radius
    A = math.pi * r ** 2  # cross-sectional area (full pipe)
    P = 2 * math.pi * r   # wetted perimeter (full pipe)
    R_h = A / P            # hydraulic radius = r/2 for circular pipe

    # Ensure minimum hydraulic slope to avoid sqrt of negative or zero values
    slope_eff = max(abs(slope), 0.001)

    # Analytical coefficient: pi / (4^(5/3)) = 0.3116996... approx 0.3117
    Q = (1.0 / roughness) * A * (R_h ** (2.0 / 3.0)) * math.sqrt(slope_eff)
    return Q



def pipe_velocity(
    diameter_m: float,
    flow_m3s: float,
) -> float:
    """Calculate mean velocity in pipe (m/s) given flow and internal diameter."""
    if diameter_m <= 0:
        return 0.0
    area = math.pi * ((diameter_m / 2.0) ** 2)
    return flow_m3s / area if area > 0 else 0.0



def batch_capacity(edges: list[dict]) -> dict:
    """
    Calculate capacity for multiple pipe edges at once.

    Args:
        edges: List of dicts with keys: 'id', 'diameter', 'length', 'slope', 'roughness' (optional).

    Returns:
        Dict mapping edge_id → capacity in m³/s.
    """
    results = {}
    for edge in edges:
        edge_id = edge.get("id", f"{edge.get('u', '?')}_{edge.get('v', '?')}")
        q = pipe_capacity(
            diameter_m=edge.get("diameter", 0.3),
            length_m=edge.get("length", 50),
            slope=edge.get("slope", 0.005),
            roughness=edge.get("roughness", 0.013),
        )
        results[edge_id] = round(q, 6)
    return results


# Quick reference: typical Manning's roughness values
ROUGHNESS_TABLE = {
    "concrete":      0.013,
    "cast_iron":     0.012,
    "pvc":           0.009,
    "corrugated":    0.024,
    "brick":         0.015,
    "earth_channel": 0.025,
}
