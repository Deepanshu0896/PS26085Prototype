/**
 * Agastya — API Client
 * Communicates with the FastAPI backend for flood simulation,
 * routing, choke analysis, and live rain data.
 */

/**
 * Centralized API base URL resolver.
 * - In Production: uses VITE_API_BASE (normalized, trailing slashes removed).
 *   Never defaults to localhost in production.
 * - In Development: defaults to 'http://localhost:8000' only when VITE_API_BASE is unset.
 */
export function getApiBaseUrl(): string {
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (envBase) {
    return envBase.replace(/\/+$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  return '';
}

export const API_BASE = getApiBaseUrl();

// ─── Types ────────────────────────────────────────────────

export interface NodeDepth {
  node_id: string;
  id?: string;
  name: string;
  lat: number;
  lon: number;
  lng?: number;
  depth_cm: number;
  depth?: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
  risk?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
  blocked?: boolean;
  role?: 'sag' | 'hospital' | 'railway' | 'junction';
}

export interface FloodSummary {
  total_nodes: number;
  flooded_nodes: number;
  max_depth_cm: number;
  avg_depth_cm: number;
  avg_flooded_depth_cm: number;
  risk_breakdown: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    SAFE: number;
  };
}

export interface SimulateResponse {
  depths: Record<string, number>;
  nodes: NodeDepth[];
  summary: FloodSummary;
  rain_mm: number;
  minutes: number;
}

export interface PathCoord {
  node_id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface RouteResponse {
  path: string[];
  path_coords: PathCoord[];
  distance_m: number;
  blocked_nodes: string[];
  blocked_count: number;
  eta_normal_sec: number;
  eta_safe_sec: number;
  eta_saved_sec: number;
  detour_delay_sec?: number;
  detour_extra_m?: number;
  detour_m?: number;
  eta_sec?: number;
  avoided_segments?: number;
  reachable: boolean;
  reason?: string;
  origin_depth_cm?: number;
  destination_depth_cm?: number;
  threshold_cm?: number;
  message: string;
}


export interface ChokeNeighbour {
  node_id: string;
  name: string;
  depth_before_cm: number;
  depth_after_cm: number;
  depth_increase_cm: number;
  lat: number;
  lon: number;
}

export interface ChokeResponse {
  choked_node: string;
  choked_name: string;
  flooded_neighbours: ChokeNeighbour[];
  depths_after: Record<string, number>;
  total_depth_increase_cm: number;
}

export interface NetworkNode {
  lat: number;
  lon: number;
  name: string;
  elevation: number;
}

export interface NetworkEdge {
  from_id: string;
  to_id: string;
  from_lat: number;
  from_lon: number;
  to_lat: number;
  to_lon: number;
  length: number;
  diameter: number;
}

export interface NetworkResponse {
  nodes: Record<string, NetworkNode>;
  edges: NetworkEdge[];
  center: { lat: number; lon: number };
  zoom: number;
  location: string;
}

export interface RainHourly {
  time: string;
  precipitation_mm: number;
  rain_mm: number;
  weather_code: number;
}

export interface RainResponse {
  location: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  current_rain_mm: number;
  current_temperature_c: number;
  wind_speed_kmh: number;
  hourly_forecast: RainHourly[];
  source: string;
}

// ─── API Functions ────────────────────────────────────────

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = API_BASE ? `${API_BASE}${normalizedEndpoint}` : normalizedEndpoint;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function simulate(
  rain_mm: number,
  minutes: number = 30,
  blocked_nodes: string[] = []
): Promise<SimulateResponse> {
  return fetchApi<SimulateResponse>('/api/simulate', {
    method: 'POST',
    body: JSON.stringify({ rain_mm, minutes, blocked_nodes }),
  });
}

export async function findRoute(
  source: string,
  target: string,
  rain_mm: number,
  threshold_cm: number = 15,
  minutes: number = 30,
  blocked_nodes: string[] = [],
  depths?: Record<string, number>
): Promise<RouteResponse> {
  return fetchApi<RouteResponse>('/api/route', {
    method: 'POST',
    body: JSON.stringify({ source, target, rain_mm, threshold_cm, minutes, blocked_nodes, depths }),
  });
}

export async function chokeNode(
  node_id: string,
  rain_mm: number,
  minutes: number = 30,
  node_ids: string[] = []
): Promise<ChokeResponse> {
  return fetchApi<ChokeResponse>('/api/choke', {
    method: 'POST',
    body: JSON.stringify({ node_id, rain_mm, minutes, node_ids }),
  });
}

export async function fetchLiveRain(): Promise<RainResponse> {
  return fetchApi<RainResponse>('/api/rain/live');
}

export async function fetchNetwork(): Promise<NetworkResponse> {
  return fetchApi<NetworkResponse>('/api/network');
}

export interface PysewerStatusResponse {
  pysewer_installed: boolean;
  version: string | null;
  mode: string;
  description: string;
  standards: string;
  hydraulic_solver: string;
  minimum_slope: number;
  self_cleansing_velocity_ms: number;
  max_velocity_ms: number;
  manning_roughness_concrete: number;
  catchment: string;
}

export interface PysewerSynthesizeResponse {
  status: string;
  method: string;
  outfall_node: string;
  outfall_elevation_m: number;
  total_nodes: number;
  total_pipes: number;
  total_length_m: number;
  design_rainfall_mm_hr: number;
  compliant_cleansing_count?: number;
  compliance_pct?: number;
  pipes: Array<{
    from_node: string;
    to_node: string;
    from_name?: string;
    to_name?: string;
    length_m: number;
    slope_pct: number;
    design_flow_m3s: number;
    diameter_m: number;
    diameter_mm: number;
    capacity_m3s: number;
    velocity_ms: number;
    meets_cleansing_vel: boolean;
    scouring_risk?: boolean;
  }>;
}


export async function fetchPysewerStatus(): Promise<PysewerStatusResponse> {
  return fetchApi<PysewerStatusResponse>('/api/pysewer/status');
}

export async function synthesizePysewer(design_rain_mm_hr: number = 35): Promise<PysewerSynthesizeResponse> {
  return fetchApi<PysewerSynthesizeResponse>(`/api/pysewer/synthesize?design_rain_mm_hr=${design_rain_mm_hr}`, {
    method: 'POST',
  });
}

export async function healthCheck(): Promise<{ status: string }> {
  return fetchApi<{ status: string }>('/health');
}
