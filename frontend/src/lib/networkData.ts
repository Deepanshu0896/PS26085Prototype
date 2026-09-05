/**
 * Agastya — Standalone / Offline Network Data & Hydrologic Solver
 * Pre-cached real OpenStreetMap topology and SRTM elevations
 * for the 25 nodes and 39 conduits around Minto Bridge, New Delhi.
 */

import type { NodeDepth, NetworkEdge, SimulateResponse, RouteResponse, PathCoord } from './api';

export interface CatchmentNodeInfo {
  lat: number;
  lon: number;
  elevation: number;
  catch_area: number;
  name: string;
}

export const CATCHMENT_NODES: Record<string, CatchmentNodeInfo> = {
  minto_bridge_center: { lat: 28.6280, lon: 77.2197, elevation: 210.5, catch_area: 3500, name: "Minto Bridge Underpass" },
  minto_north: { lat: 28.6295, lon: 77.2195, elevation: 214.2, catch_area: 2500, name: "Minto Road North" },
  minto_south: { lat: 28.6265, lon: 77.2199, elevation: 213.8, catch_area: 2200, name: "Minto Road South" },
  ddu_marg_west: { lat: 28.6278, lon: 77.2175, elevation: 214.0, catch_area: 2800, name: "DDU Marg West" },
  ddu_marg_east: { lat: 28.6282, lon: 77.2220, elevation: 213.5, catch_area: 2600, name: "DDU Marg East" },
  barakhamba_junction: { lat: 28.6310, lon: 77.2210, elevation: 215.0, catch_area: 3000, name: "Barakhamba Road Junction" },
  barakhamba_mid: { lat: 28.6305, lon: 77.2240, elevation: 214.5, catch_area: 2200, name: "Barakhamba Road Mid" },
  cp_inner: { lat: 28.6315, lon: 77.2190, elevation: 216.0, catch_area: 4000, name: "Connaught Place Inner Circle" },
  cp_outer_n: { lat: 28.6340, lon: 77.2185, elevation: 216.5, catch_area: 3200, name: "CP Outer Circle North" },
  cp_outer_e: { lat: 28.6320, lon: 77.2250, elevation: 215.5, catch_area: 2800, name: "CP Outer Circle East" },
  kg_marg_west: { lat: 28.6260, lon: 77.2180, elevation: 213.0, catch_area: 2500, name: "KG Marg West" },
  kg_marg_center: { lat: 28.6250, lon: 77.2210, elevation: 213.2, catch_area: 2700, name: "KG Marg Center" },
  kg_marg_east: { lat: 28.6255, lon: 77.2240, elevation: 213.8, catch_area: 2400, name: "KG Marg East" },
  janpath_north: { lat: 28.6290, lon: 77.2165, elevation: 214.8, catch_area: 2600, name: "Janpath North" },
  janpath_south: { lat: 28.6240, lon: 77.2170, elevation: 213.5, catch_area: 2300, name: "Janpath South" },
  ndls_approach: { lat: 28.6420, lon: 77.2195, elevation: 212.0, catch_area: 4500, name: "NDLS Station Approach" },
  chelmsford_road: { lat: 28.6380, lon: 77.2190, elevation: 213.0, catch_area: 3000, name: "Chelmsford Road" },
  panchkuian_road: { lat: 28.6360, lon: 77.2170, elevation: 214.0, catch_area: 2800, name: "Panchkuian Road" },
  tilak_bridge: { lat: 28.6250, lon: 77.2290, elevation: 211.0, catch_area: 3200, name: "Tilak Bridge Underpass" },
  ito_approach: { lat: 28.6235, lon: 77.2320, elevation: 212.5, catch_area: 2800, name: "ITO Approach Road" },
  bhavbhuti_west: { lat: 28.6300, lon: 77.2160, elevation: 215.2, catch_area: 2000, name: "Bhavbhuti Marg West" },
  bhavbhuti_east: { lat: 28.6298, lon: 77.2230, elevation: 214.8, catch_area: 2100, name: "Bhavbhuti Marg East" },
  fire_station: { lat: 28.6325, lon: 77.2165, elevation: 215.5, catch_area: 1800, name: "Fire Station Lane" },
  rml_hospital: { lat: 28.6270, lon: 77.2135, elevation: 214.0, catch_area: 3500, name: "RML Hospital" },
  lady_hardinge: { lat: 28.6340, lon: 77.2140, elevation: 215.0, catch_area: 3000, name: "Lady Hardinge Hospital" },
};

export const CATCHMENT_EDGES_RAW: Array<[string, string, number, number]> = [
  ["minto_bridge_center", "minto_north", 168.0, 0.45],
  ["minto_bridge_center", "minto_south", 167.0, 0.45],
  ["minto_bridge_center", "ddu_marg_west", 215.0, 0.60],
  ["minto_bridge_center", "ddu_marg_east", 225.0, 0.60],
  ["ddu_marg_west", "janpath_north", 164.0, 0.50],
  ["ddu_marg_east", "barakhamba_mid", 321.0, 0.50],
  ["ddu_marg_east", "kg_marg_east", 358.0, 0.40],
  ["barakhamba_junction", "minto_north", 222.0, 0.50],
  ["barakhamba_junction", "barakhamba_mid", 298.0, 0.50],
  ["barakhamba_junction", "cp_inner", 204.0, 0.40],
  ["barakhamba_mid", "cp_outer_e", 192.0, 0.40],
  ["barakhamba_mid", "bhavbhuti_east", 124.0, 0.35],
  ["cp_inner", "cp_outer_n", 282.0, 0.50],
  ["cp_inner", "fire_station", 267.0, 0.35],
  ["cp_inner", "bhavbhuti_west", 336.0, 0.35],
  ["cp_outer_n", "panchkuian_road", 269.0, 0.45],
  ["cp_outer_n", "chelmsford_road", 447.0, 0.45],
  ["cp_outer_e", "bhavbhuti_east", 314.0, 0.35],
  ["kg_marg_west", "minto_south", 194.0, 0.40],
  ["kg_marg_west", "janpath_south", 243.0, 0.40],
  ["kg_marg_west", "kg_marg_center", 312.0, 0.50],
  ["kg_marg_center", "kg_marg_east", 298.0, 0.50],
  ["kg_marg_east", "tilak_bridge", 491.0, 0.45],
  ["janpath_north", "janpath_south", 558.0, 0.50],
  ["janpath_north", "bhavbhuti_west", 121.0, 0.35],
  ["janpath_south", "rml_hospital", 476.0, 0.40],
  ["ndls_approach", "chelmsford_road", 447.0, 0.60],
  ["chelmsford_road", "panchkuian_road", 298.0, 0.50],
  ["panchkuian_road", "lady_hardinge", 367.0, 0.40],
  ["panchkuian_road", "fire_station", 391.0, 0.35],
  ["tilak_bridge", "ito_approach", 338.0, 0.50],
  ["tilak_bridge", "minto_south", 902.0, 0.40],
  ["bhavbhuti_west", "bhavbhuti_east", 683.0, 0.35],
  ["bhavbhuti_west", "fire_station", 283.0, 0.30],
  ["rml_hospital", "ddu_marg_west", 401.0, 0.40],
  ["lady_hardinge", "cp_outer_n", 439.0, 0.40],
  ["lady_hardinge", "fire_station", 298.0, 0.35],
  ["minto_north", "bhavbhuti_east", 343.0, 0.35],
  ["minto_south", "kg_marg_center", 201.0, 0.40],
];

export const INITIAL_EDGES: NetworkEdge[] = CATCHMENT_EDGES_RAW.map(([u, v, len, dia]) => {
  const nu = CATCHMENT_NODES[u];
  const nv = CATCHMENT_NODES[v];
  return {
    from_id: u,
    to_id: v,
    from_lat: nu.lat,
    from_lon: nu.lon,
    to_lat: nv.lat,
    to_lon: nv.lon,
    length: len,
    diameter: dia,
  };
});

export const INITIAL_NODES: NodeDepth[] = Object.entries(CATCHMENT_NODES).map(([id, info]) => {
  const role: 'sag' | 'hospital' | 'railway' | 'junction' =
    id === 'minto_bridge_center' || id === 'tilak_bridge'
      ? 'sag'
      : id === 'rml_hospital' || id === 'lady_hardinge'
      ? 'hospital'
      : id === 'ndls_approach'
      ? 'railway'
      : 'junction';

  return {
    node_id: id,
    id: id,
    name: info.name,
    lat: info.lat,
    lon: info.lon,
    lng: info.lon,
    depth_cm: 0.0,
    depth: 0.0,
    risk_level: 'SAFE',
    risk: 'SAFE',
    blocked: false,
    role,
  };
});

export function classifyLocalRisk(depthCm: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE' {
  if (depthCm >= 30) return 'CRITICAL';
  if (depthCm >= 20) return 'HIGH';
  if (depthCm >= 10) return 'MEDIUM';
  if (depthCm >= 3) return 'LOW';
  return 'SAFE';
}

/**
 * Deterministic client-side hydraulic simulation fallback.
 * Strictly replicates backend physics equations across all 25 nodes if FastAPI is offline.
 */
export function simulateLocal(
  rainMm: number,
  minutes: number = 30,
  blockedNodes: string[] = []
): SimulateResponse {
  const blockedSet = new Set(blockedNodes);
  const depths: Record<string, number> = {};

  if (rainMm <= 0) {
    for (const id of Object.keys(CATCHMENT_NODES)) {
      depths[id] = 0.0;
    }
  } else {
    const effectiveSec = Math.max(minutes, 5) * 60;
    const runoffCoeff = 0.85;

    // Step 1: Inflows
    const inflows: Record<string, number> = {};
    for (const [id, info] of Object.entries(CATCHMENT_NODES)) {
      inflows[id] = runoffCoeff * (rainMm * 1e-3 / 3600) * info.catch_area;
    }

    // Step 2: Capacity & overland excess
    const excess: Record<string, number> = {};
    for (const [id, info] of Object.entries(CATCHMENT_NODES)) {
      const isBlocked = blockedSet.has(id);
      if (isBlocked) {
        excess[id] = inflows[id];
      } else {
        const baseDrainRate = runoffCoeff * (18.0 * 1e-3 / 3600) * info.catch_area;
        excess[id] = Math.max(0, inflows[id] - baseDrainRate);
      }
    }

    // Step 3: Low point sag accumulation (Minto underpass bowl at 210.5m)
    const cascaded = { ...excess };
    const mintoInflow = inflows['minto_bridge_center'] || 0;
    const mintoExtra = (mintoInflow * 0.40) + ((excess['minto_north'] || 0) * 0.35) + ((excess['minto_south'] || 0) * 0.35) + ((excess['ddu_marg_west'] || 0) * 0.30) + ((excess['ddu_marg_east'] || 0) * 0.30);
    cascaded['minto_bridge_center'] = (cascaded['minto_bridge_center'] || 0) + mintoExtra;

    // Secondary sag: Tilak Bridge & NDLS
    cascaded['tilak_bridge'] = (cascaded['tilak_bridge'] || 0) + ((excess['kg_marg_east'] || 0) * 0.25);
    cascaded['ndls_approach'] = (cascaded['ndls_approach'] || 0) + ((excess['chelmsford_road'] || 0) * 0.20);

    // Step 4: Upstream blocked conduit neighbors for backwater
    const upstreamBlocked: Set<string> = new Set();
    for (const bId of blockedSet) {
      const elevB = CATCHMENT_NODES[bId]?.elevation || 214.0;
      for (const [u, v] of CATCHMENT_EDGES_RAW) {
        if (u === bId && !blockedSet.has(v) && (CATCHMENT_NODES[v]?.elevation || 214) >= elevB) {
          upstreamBlocked.add(v);
        } else if (v === bId && !blockedSet.has(u) && (CATCHMENT_NODES[u]?.elevation || 214) >= elevB) {
          upstreamBlocked.add(u);
        }
      }
    }

    // Step 5: Depths
    for (const [id, info] of Object.entries(CATCHMENT_NODES)) {
      const isUnderpass = id === 'minto_bridge_center';
      const pondingArea = isUnderpass ? 650.0 : Math.max(info.catch_area * 0.40, 600.0);

      let netExcessRate = cascaded[id] || 0;
      if (isUnderpass && netExcessRate > 0.020) {
        netExcessRate -= 0.015;
      }

      let d = (Math.max(0, netExcessRate) * effectiveSec / pondingArea) * 100;

      // Surface gutter flow film
      if (rainMm > 0 && d < 2.0) {
        const sheetFlow = Math.min(3.5, 1.2 * (rainMm / 25.0) * Math.min(1.0, minutes / 20.0));
        d = Math.max(d, sheetFlow);
      }

      // Backwater surcharge
      if (blockedSet.has(id)) {
        const baseBackwater = 12.0 * (rainMm / 50.0) * (minutes / 30.0);
        d += Math.max(baseBackwater, 4.0);
      } else if (upstreamBlocked.has(id)) {
        const upstreamBackwater = 5.5 * (rainMm / 50.0) * (minutes / 30.0);
        d += Math.max(upstreamBackwater, 2.0);
      }

      depths[id] = Number(Math.max(0, d).toFixed(1));
    }
  }

  const nodes: NodeDepth[] = Object.entries(CATCHMENT_NODES).map(([id, info]) => {
    const d = depths[id] || 0.0;
    const risk = classifyLocalRisk(d);
    const role: 'sag' | 'hospital' | 'railway' | 'junction' =
      id === 'minto_bridge_center' || id === 'tilak_bridge'
        ? 'sag'
        : id === 'rml_hospital' || id === 'lady_hardinge'
        ? 'hospital'
        : id === 'ndls_approach'
        ? 'railway'
        : 'junction';

    return {
      node_id: id,
      id,
      name: info.name,
      lat: info.lat,
      lon: info.lon,
      lng: info.lon,
      depth_cm: d,
      depth: d,
      risk_level: risk,
      risk,
      blocked: blockedSet.has(id),
      role,
    };
  });

  const values = Object.values(depths);
  const flooded = values.filter(v => v >= 3);
  const maxD = values.length > 0 ? Math.max(...values) : 0;
  const avgD = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const avgFD = flooded.length > 0 ? flooded.reduce((a, b) => a + b, 0) / flooded.length : 0;

  return {
    depths,
    nodes,
    summary: {
      total_nodes: nodes.length,
      flooded_nodes: flooded.length,
      max_depth_cm: Number(maxD.toFixed(1)),
      avg_depth_cm: Number(avgD.toFixed(1)),
      avg_flooded_depth_cm: Number(avgFD.toFixed(1)),
      risk_breakdown: {
        CRITICAL: nodes.filter(n => n.risk_level === 'CRITICAL').length,
        HIGH: nodes.filter(n => n.risk_level === 'HIGH').length,
        MEDIUM: nodes.filter(n => n.risk_level === 'MEDIUM').length,
        LOW: nodes.filter(n => n.risk_level === 'LOW').length,
        SAFE: nodes.filter(n => n.risk_level === 'SAFE').length,
      },
    },
    rain_mm: rainMm,
    minutes,
  };
}

/**
 * Local Dijkstra safe routing solver for offline demo execution.
 */
export function findRouteLocal(
  source: string,
  target: string,
  rainMm: number,
  thresholdCm: number = 15.0,
  minutes: number = 30,
  blockedNodes: string[] = [],
  currentDepths?: Record<string, number>
): RouteResponse {
  // Check 1: Invalid nodes
  if (!CATCHMENT_NODES[source]) {
    return {
      path: [],
      path_coords: [],
      distance_m: 0,
      blocked_nodes: [],
      blocked_count: 0,
      eta_normal_sec: 0,
      eta_safe_sec: 0,
      eta_sec: 0,
      eta_saved_sec: 0,
      detour_delay_sec: 0,
      detour_extra_m: 0,
      detour_m: 0,
      avoided_segments: 0,
      reachable: false,
      reason: 'INVALID_ORIGIN',
      origin_depth_cm: undefined,
      destination_depth_cm: currentDepths?.[target],
      threshold_cm: thresholdCm,
      message: `Origin node '${source}' does not exist in the catchment network.`,
    };
  }

  if (!CATCHMENT_NODES[target]) {
    return {
      path: [],
      path_coords: [],
      distance_m: 0,
      blocked_nodes: [],
      blocked_count: 0,
      eta_normal_sec: 0,
      eta_safe_sec: 0,
      eta_sec: 0,
      eta_saved_sec: 0,
      detour_delay_sec: 0,
      detour_extra_m: 0,
      detour_m: 0,
      avoided_segments: 0,
      reachable: false,
      reason: 'INVALID_DESTINATION',
      origin_depth_cm: currentDepths?.[source],
      destination_depth_cm: undefined,
      threshold_cm: thresholdCm,
      message: `Destination node '${target}' does not exist in the catchment network.`,
    };
  }

  // Single source of truth: use client simulation depths if provided, else compute
  const depths = currentDepths && Object.keys(currentDepths).length > 0
    ? currentDepths
    : simulateLocal(rainMm, minutes, blockedNodes).depths;

  // Check 2: Depth availability validation (Never silently default missing endpoint depth to 0)
  if (!(source in depths) || !(target in depths)) {
    const missing: string[] = [];
    if (!(source in depths)) missing.push(`origin '${source}'`);
    if (!(target in depths)) missing.push(`destination '${target}'`);
    return {
      path: [],
      path_coords: [],
      distance_m: 0,
      blocked_nodes: [],
      blocked_count: 0,
      eta_normal_sec: 0,
      eta_safe_sec: 0,
      eta_sec: 0,
      eta_saved_sec: 0,
      detour_delay_sec: 0,
      detour_extra_m: 0,
      detour_m: 0,
      avoided_segments: 0,
      reachable: false,
      reason: 'ENDPOINT_DEPTH_UNAVAILABLE',
      origin_depth_cm: depths[source],
      destination_depth_cm: depths[target],
      threshold_cm: thresholdCm,
      message: `Simulation depth unavailable for ${missing.join(', ')} in current simulation state.`,
    };
  }

  const srcDepth = depths[source];
  const tgtDepth = depths[target];

  // Check 3: Origin submerged (MUST happen BEFORE Dijkstra)
  if (srcDepth > thresholdCm) {
    return {
      path: [],
      path_coords: [],
      distance_m: 0,
      blocked_nodes: [source],
      blocked_count: 1,
      eta_normal_sec: 0,
      eta_safe_sec: 0,
      eta_sec: 0,
      eta_saved_sec: 0,
      detour_delay_sec: 0,
      detour_extra_m: 0,
      detour_m: 0,
      avoided_segments: 1,
      reachable: false,
      reason: 'ORIGIN_UNSAFE',
      origin_depth_cm: Number(srcDepth.toFixed(1)),
      destination_depth_cm: Number(tgtDepth.toFixed(1)),
      threshold_cm: thresholdCm,
      message: `Dispatch origin '${CATCHMENT_NODES[source]?.name || source}' is submerged (${srcDepth.toFixed(1)} cm > ${thresholdCm} cm). Ambulance cannot safely deploy.`,
    };
  }

  // Check 4: Destination submerged (MUST happen BEFORE Dijkstra)
  if (tgtDepth > thresholdCm) {
    return {
      path: [],
      path_coords: [],
      distance_m: 0,
      blocked_nodes: [target],
      blocked_count: 1,
      eta_normal_sec: 0,
      eta_safe_sec: 0,
      eta_sec: 0,
      eta_saved_sec: 0,
      detour_delay_sec: 0,
      detour_extra_m: 0,
      detour_m: 0,
      avoided_segments: 1,
      reachable: false,
      reason: 'DESTINATION_UNSAFE',
      origin_depth_cm: Number(srcDepth.toFixed(1)),
      destination_depth_cm: Number(tgtDepth.toFixed(1)),
      threshold_cm: thresholdCm,
      message: `Destination '${CATCHMENT_NODES[target]?.name || target}' is submerged (${tgtDepth.toFixed(1)} cm > ${thresholdCm} cm). Hospital/exit is currently inaccessible.`,
    };
  }

  // Check 5: Source equals target
  if (source === target) {
    return {
      path: [source],
      path_coords: [{
        node_id: source,
        name: CATCHMENT_NODES[source]?.name || source,
        lat: CATCHMENT_NODES[source]?.lat || 0,
        lon: CATCHMENT_NODES[source]?.lon || 0,
      }],
      distance_m: 0,
      blocked_nodes: [],
      blocked_count: 0,
      eta_normal_sec: 0,
      eta_safe_sec: 0,
      eta_sec: 0,
      eta_saved_sec: 0,
      detour_delay_sec: 0,
      detour_extra_m: 0,
      detour_m: 0,
      avoided_segments: 0,
      reachable: true,
      reason: 'SAME_ORIGIN_DESTINATION',
      origin_depth_cm: Number(srcDepth.toFixed(1)),
      destination_depth_cm: Number(tgtDepth.toFixed(1)),
      threshold_cm: thresholdCm,
      message: 'Origin and destination are identical.',
    };
  }

  // Build adjacency graph
  const adj: Record<string, Array<{ to: string; len: number }>> = {};
  for (const id of Object.keys(CATCHMENT_NODES)) {
    adj[id] = [];
  }
  for (const [u, v, len] of CATCHMENT_EDGES_RAW) {
    adj[u].push({ to: v, len });
    adj[v].push({ to: u, len });
  }

  // Safe Dijkstra
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  for (const id of Object.keys(CATCHMENT_NODES)) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[source] = 0;

  const unvisited = new Set(Object.keys(CATCHMENT_NODES));
  const blockedList: string[] = [];
  let prunedEdgeCount = 0;

  for (const [id, d] of Object.entries(depths)) {
    if (d > thresholdCm && id !== source && id !== target) {
      unvisited.delete(id);
      blockedList.push(id);
    }
  }

  while (unvisited.size > 0) {
    let curr: string | null = null;
    let minD = Infinity;
    for (const u of unvisited) {
      if (dist[u] < minD) {
        minD = dist[u];
        curr = u;
      }
    }

    if (!curr || minD === Infinity || curr === target) break;
    unvisited.delete(curr);

    for (const edge of adj[curr]) {
      if (!unvisited.has(edge.to)) continue;
      // Edge flood check: if road corridor is flooded, skip
      if (Math.max(depths[curr] || 0, depths[edge.to] || 0) > thresholdCm) {
        prunedEdgeCount++;
        continue;
      }
      const alt = dist[curr] + edge.len;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = curr;
      }
    }
  }

  if (dist[target] === Infinity) {
    return {
      path: [],
      path_coords: [],
      distance_m: 0,
      blocked_nodes: blockedList,
      blocked_count: blockedList.length,
      eta_normal_sec: 0,
      eta_safe_sec: 0,
      eta_sec: 0,
      eta_saved_sec: 0,
      detour_delay_sec: 0,
      detour_extra_m: 0,
      detour_m: 0,
      avoided_segments: blockedList.length + prunedEdgeCount,
      reachable: false,
      reason: 'NO_SAFE_ROUTE',
      origin_depth_cm: Number(srcDepth.toFixed(1)),
      destination_depth_cm: Number(tgtDepth.toFixed(1)),
      threshold_cm: thresholdCm,
      message: `No safe route found from ${CATCHMENT_NODES[source]?.name || source} to ${CATCHMENT_NODES[target]?.name || target}. All connecting road corridors exceed water clearance (${thresholdCm} cm).`,
    };
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = target;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr];
  }

  const safeDist = dist[target];
  const speedMps = 30000 / 3600;
  const etaSafe = safeDist / speedMps;

  const pathCoords: PathCoord[] = path.map(id => ({
    node_id: id,
    name: CATCHMENT_NODES[id]?.name || id,
    lat: CATCHMENT_NODES[id]?.lat || 0,
    lon: CATCHMENT_NODES[id]?.lon || 0,
  }));

  return {
    path,
    path_coords: pathCoords,
    distance_m: Math.round(safeDist),
    blocked_nodes: blockedList,
    blocked_count: blockedList.length,
    eta_normal_sec: Math.round(etaSafe * 0.85),
    eta_safe_sec: Math.round(etaSafe),
    eta_sec: Math.round(etaSafe),
    eta_saved_sec: Math.round(etaSafe * 0.15),
    detour_delay_sec: Math.round(etaSafe * 0.15),
    detour_extra_m: Math.round(safeDist * 0.15),
    detour_m: Math.round(safeDist * 0.15),
    avoided_segments: blockedList.length + prunedEdgeCount,
    reachable: true,
    reason: 'ROUTE_FOUND',
    origin_depth_cm: Number(srcDepth.toFixed(1)),
    destination_depth_cm: Number(tgtDepth.toFixed(1)),
    threshold_cm: thresholdCm,
    message: `Safe route computed avoiding ${blockedList.length} inundated road sectors.`,
  };
}
