/**
 * Agastya — Urban Flood Nowcasting Platform
 * Minto Bridge, New Delhi — SIH 2026 (Problem 26085)
 * Main Dashboard Layout, Operational KPIs, Multi-Node Choke, and Safe Routing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import FloodMap from './components/FloodMap';
import AlertPanel from './components/AlertPanel';
import {
  simulate,
  findRoute,
  fetchLiveRain,
  fetchNetwork,
  type NodeDepth,
  type FloodSummary,
  type RouteResponse,
  type NetworkEdge,
  type PathCoord,
  type RainResponse,
} from './lib/api';
import {
  INITIAL_NODES,
  INITIAL_EDGES,
  CATCHMENT_NODES,
  simulateLocal,
  findRouteLocal,
} from './lib/networkData';

export default function App() {
  // ─── State ───────────────────────────────────────────────
  const [rainMm, setRainMm] = useState<number>(35);
  const [minutes, setMinutes] = useState<number>(30);
  const [blockedNodes, setBlockedNodes] = useState<string[]>([]);

  const [nodes, setNodes] = useState<NodeDepth[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<NetworkEdge[]>(INITIAL_EDGES);
  const [summary, setSummary] = useState<FloodSummary | null>(null);
  const [rainData, setRainData] = useState<RainResponse | null>(null);

  const [chokeMode, setChokeMode] = useState<boolean>(false);

  const [showRoute, setShowRoute] = useState<boolean>(false);
  const [routeSource, setRouteSource] = useState<string>('cp_outer_n');
  const [routeTarget, setRouteTarget] = useState<string>('barakhamba_junction');
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [routePath, setRoutePath] = useState<PathCoord[]>([]);

  const [nodeList, setNodeList] = useState<{ id: string; name: string }[]>(() =>
    Object.entries(CATCHMENT_NODES).map(([id, info]) => ({
      id,
      name: info.name,
    }))
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [mapCenter] = useState<[number, number]>([28.6280, 77.2197]);
  const [zoom] = useState<number>(15);

  const debounceTimer = useRef<number | null>(null);

  // ─── Initial Network & Weather Load ───────────────────────
  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const net = await fetchNetwork();
        if (net && net.edges && net.edges.length > 0) {
          setEdges(net.edges);
          const list = Object.entries(net.nodes).map(([id, info]) => ({
            id,
            name: info.name || id,
          }));
          setNodeList(list);
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.warn('Network fetch using cached 25-node topology:', err);
      }

      try {
        const rain = await fetchLiveRain();
        setRainData(rain);
      } catch (err) {
        console.warn('Live rain API using cached fallback:', err);
      }

      setLoading(false);
    }

    initData();
  }, []);

  // ─── Trigger Simulation ───────────────────────────────────
  const runSimulation = useCallback(
    async (rain: number, stormMinutes: number, blocked: string[]) => {
      setLoading(true);
      try {
        const res = await simulate(rain, stormMinutes, blocked);
        setNodes(res.nodes);
        setSummary(res.summary);
        setIsLiveConnected(true);
      } catch (err) {
        console.warn('Simulation using local physical solver fallback:', err);
        const res = simulateLocal(rain, stormMinutes, blocked);
        setNodes(res.nodes);
        setSummary(res.summary);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced effect whenever rain intensity, storm duration, or blocked nodes change
  useEffect(() => {
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = window.setTimeout(() => {
      runSimulation(rainMm, minutes, blockedNodes);
    }, 120);

    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [rainMm, minutes, blockedNodes, runSimulation]);

  // ─── Immediate Route Invalidation ─────────────────────────
  // Whenever rainfall, duration, blocked nodes, origin, or destination changes,
  // immediately clear the existing route polyline to prevent stale routes.
  useEffect(() => {
    setRoutePath([]);
  }, [rainMm, minutes, blockedNodes, routeSource, routeTarget]);

  // ─── Ambulance Route Calculation ──────────────────────────
  const runRouting = useCallback(
    async (src: string, tgt: string, rain: number, stormMinutes: number, blocked: string[], currentDepths?: Record<string, number>) => {
      if (!showRoute || !src || !tgt) {
        setRoutePath([]);
        setRouteResult(null);
        return;
      }

      // Invalidate old route polyline immediately while waiting for fresh solver response
      setRoutePath([]);

      try {
        const res = await findRoute(src, tgt, rain, 15, stormMinutes, blocked, currentDepths);
        setRouteResult(res);
        if (res.reachable) {
          setRoutePath(res.path_coords || []);
        } else {
          setRoutePath([]);
        }
      } catch (err) {
        console.warn('Routing using local Dijkstra fallback solver:', err);
        const res = findRouteLocal(src, tgt, rain, 15, stormMinutes, blocked, currentDepths);
        setRouteResult(res);
        if (res.reachable) {
          setRoutePath(res.path_coords || []);
        } else {
          setRoutePath([]);
        }
      }
    },
    [showRoute]
  );

  useEffect(() => {
    if (showRoute && nodes.length > 0) {
      const depthsMap: Record<string, number> = {};
      nodes.forEach(n => { depthsMap[n.node_id] = n.depth_cm; });
      runRouting(routeSource, routeTarget, rainMm, minutes, blockedNodes, depthsMap);
    } else {
      setRoutePath([]);
      setRouteResult(null);
    }
  }, [showRoute, routeSource, routeTarget, rainMm, minutes, blockedNodes, nodes, runRouting]);

  // ─── Multi-Node Choke Toggle Handler ──────────────────────
  const handleNodeClick = (nodeId: string) => {
    // If the node is currently blocked, clicking it ALWAYS unblocks it immediately
    if (blockedNodes.includes(nodeId)) {
      setBlockedNodes(prev => prev.filter(id => id !== nodeId));
      return;
    }

    // When Choke Simulation is OFF, clicking a node must NOT block it
    if (!chokeMode) {
      return;
    }

    // Invariant: routing origin & destination cannot be choked
    if (nodeId === routeSource || nodeId === routeTarget) {
      alert(`🛡️ Routing endpoint '${CATCHMENT_NODES[nodeId]?.name || nodeId}' cannot be blocked in choke mode.`);
      return;
    }

    setBlockedNodes(prev => [...prev, nodeId]);
  };

  const handleClearBlockedNodes = () => {
    setBlockedNodes([]);
  };

  // ─── Guided Demo Mode Presets ─────────────────────────────
  const setDemoPreset = (step: number) => {
    switch (step) {
      case 1: // Dry Baseline (0 mm/hr, all depths = 0)
        setRainMm(0);
        setMinutes(30);
        setBlockedNodes([]);
        setShowRoute(false);
        setChokeMode(false);
        break;
      case 2: // Moderate Rain (35 mm/hr, all 25 nodes active)
        setRainMm(35);
        setMinutes(30);
        setBlockedNodes([]);
        setShowRoute(false);
        setChokeMode(false);
        break;
      case 3: // Monsoon Downpour (75 mm/hr, >30cm Minto underpass sag)
        setRainMm(75);
        setMinutes(30);
        setBlockedNodes([]);
        setShowRoute(false);
        setChokeMode(false);
        break;
      case 4: // Multi-Node Choke
        setRainMm(60);
        setMinutes(30);
        setChokeMode(true);
        setBlockedNodes(['minto_bridge_center', 'ddu_marg_west']);
        setShowRoute(false);
        break;
      case 5: // Safe Route Bypass
        setRainMm(60);
        setMinutes(30);
        setChokeMode(true);
        setBlockedNodes(['minto_bridge_center']);
        setRouteSource('cp_outer_n');
        setRouteTarget('barakhamba_junction');
        setShowRoute(true);
        break;
      default: // Reset Simulation to baseline
        setRainMm(35);
        setMinutes(30);
        setBlockedNodes([]);
        setShowRoute(false);
        setChokeMode(false);
        setRouteSource('cp_outer_n');
        setRouteTarget('barakhamba_junction');
        setRouteResult(null);
        setRoutePath([]);
        break;
    }
  };

  const criticalCount = summary?.risk_breakdown?.CRITICAL ?? 0;
  const highCount = summary?.risk_breakdown?.HIGH ?? 0;
  const mediumCount = summary?.risk_breakdown?.MEDIUM ?? 0;
  const maxDepth = summary?.max_depth_cm ?? 0;
  const floodedCount = summary?.flooded_nodes ?? 0;

  return (
    <div className="app-layout">
      {/* ─── Left Sidebar ─── */}
      <Sidebar
        rainMm={rainMm}
        onRainChange={setRainMm}
        minutes={minutes}
        onMinutesChange={setMinutes}
        summary={summary}
        rainData={rainData}
        chokeMode={chokeMode}
        onChokeModeToggle={() => {
          setChokeMode(prev => !prev);
        }}
        blockedNodes={blockedNodes}
        onClearBlockedNodes={handleClearBlockedNodes}
        onUnblockNode={handleNodeClick}
        showRoute={showRoute}
        onRouteToggle={() => setShowRoute(prev => !prev)}
        routeSource={routeSource}
        routeTarget={routeTarget}
        onRouteSourceChange={setRouteSource}
        onRouteTargetChange={setRouteTarget}
        routeResult={routeResult}
        nodes={nodes}
        nodeList={nodeList}
        loading={loading}
      />

      {/* ─── Main Content ─── */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* ─── Top Operator KPI Header ─── */}
        <header
          style={{
            padding: '10px 18px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.04em', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🌊 AGASTYA</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  SIH Problem 26085
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Minto Bridge Urban Flood Nowcasting & Emergency Routing
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Live / Offline status badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: isLiveConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: isLiveConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                  color: isLiveConnected ? '#34d399' : '#fbbf24',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isLiveConnected ? '#10b981' : '#f59e0b',
                    boxShadow: isLiveConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
                    display: 'inline-block',
                  }}
                />
                <span>{isLiveConnected ? 'LIVE FASTAPI API' : 'OFFLINE DEMO MODE'}</span>
              </div>

              {/* Weather feed pill */}
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>🌧️ Open-Meteo:</span>
                <span style={{ fontWeight: 800, color: '#ffffff' }}>
                  {rainData?.current_rain_mm !== undefined ? `${rainData.current_rain_mm} mm/hr` : `${rainMm} mm/hr`}
                </span>
              </div>
            </div>
          </div>

          {/* Top KPI Metrics Cards & Guided Demo Quick Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* KPI 1: Rain */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Rain Rate</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8' }}>{rainMm} mm/hr</span>
              </div>
              {/* KPI 2: Max Depth */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Max Sag Depth</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: maxDepth >= 30 ? '#ef4444' : maxDepth >= 15 ? '#f97316' : '#34d399' }}>
                  {maxDepth.toFixed(1)} cm
                </span>
              </div>
              {/* KPI 3: High Risk Nodes */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>High/Critical</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: (criticalCount + highCount) > 0 ? '#ef4444' : '#10b981' }}>
                  {criticalCount + highCount}
                </span>
              </div>
              {/* KPI 4: Caution Nodes */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Medium Risk</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>{mediumCount}</span>
              </div>
              {/* KPI 5: Flooded Sectors */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Flooded Sectors</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: floodedCount > 0 ? '#f97316' : '#10b981' }}>{floodedCount}</span>
              </div>
              {/* KPI 6: Choked Nodes */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Blocked Chokes</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: blockedNodes.length > 0 ? '#dc2626' : '#94a3b8' }}>{blockedNodes.length}</span>
              </div>
            </div>

            {/* Quick Demo Stepper Buttons for Judges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginRight: 2 }}>Demo:</span>
              <button
                type="button"
                onClick={() => setDemoPreset(1)}
                style={{ padding: '3px 7px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: rainMm === 0 ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer' }}
                title="Scenario 1: Baseline Dry Rain = 0 mm/hr"
              >
                1. Dry
              </button>
              <button
                type="button"
                onClick={() => setDemoPreset(2)}
                style={{ padding: '3px 7px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: rainMm === 35 && blockedNodes.length === 0 ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer' }}
                title="Scenario 2: Moderate Rain 35 mm/hr"
              >
                2. Moderate
              </button>
              <button
                type="button"
                onClick={() => setDemoPreset(3)}
                style={{ padding: '3px 7px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: rainMm === 75 ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer' }}
                title="Scenario 3: Monsoon Downpour 75 mm/hr (>30cm at Minto Sag)"
              >
                3. Downpour
              </button>
              <button
                type="button"
                onClick={() => setDemoPreset(4)}
                style={{ padding: '3px 7px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)', background: chokeMode && blockedNodes.length > 0 ? '#ef4444' : 'rgba(239,68,68,0.15)', color: 'white', cursor: 'pointer' }}
                title="Scenario 4: Multi-Node Manhole Choke Simulation"
              >
                4. Choke
              </button>
              <button
                type="button"
                onClick={() => setDemoPreset(5)}
                style={{ padding: '3px 7px', fontSize: 10, fontWeight: 700, borderRadius: 6, border: '1px solid rgba(16,185,129,0.4)', background: showRoute ? '#10b981' : 'rgba(16,185,129,0.15)', color: 'white', cursor: 'pointer' }}
                title="Scenario 5: Safe Ambulance Route avoiding Minto Underpass"
              >
                5. Route
              </button>
              {blockedNodes.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearBlockedNodes}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10,
                    fontWeight: 800,
                    borderRadius: 6,
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    background: '#dc2626',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title="Clear all currently blocked nodes and restore baseline drainage"
                >
                  <span>🧹</span>
                  <span>CLEAR CHOKES</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDemoPreset(0)}
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
                title="Reset simulation parameters, rain, blocked nodes and route"
              >
                ↺ RESET SIMULATION
              </button>
            </div>
          </div>
        </header>

        {/* Choke Banner Notification */}
        {(chokeMode || blockedNodes.length > 0) && (
          <div
            className="choke-mode-indicator animate-scale-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800 }}>🚨 Choke Simulation</span>
              {blockedNodes.length === 0 ? (
                <span style={{ opacity: 0.9, fontSize: 11 }}>
                  Click any manhole markers on the map to simulate silt clogs. Multiple manholes can be blocked at once.
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Blocked ({blockedNodes.length}):</span>
                  {blockedNodes.map(id => {
                    const nodeName = nodes.find(n => n.node_id === id)?.name || id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleNodeClick(id)}
                        title={`Click to UNBLOCK ${nodeName}`}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: 'rgba(239, 68, 68, 0.25)',
                          border: '1px solid #ef4444',
                          color: '#fecaca',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>🚫 {nodeName}</span>
                        <span style={{ fontWeight: 900, color: '#ffffff' }}>✕</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {blockedNodes.length > 0 && (
              <button
                type="button"
                onClick={handleClearBlockedNodes}
                style={{
                  background: 'white',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: 12,
                  padding: '3px 10px',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                🧹 Clear All
              </button>
            )}
          </div>
        )}

        {/* Route Safety Warning Banner */}
        {showRoute && routeResult && !routeResult.reachable && (
          <div
            id="route-safety-banner"
            style={{
              background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)',
              color: '#ffffff',
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #ef4444',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🚨</span>
              <div>
                <span style={{ fontWeight: 800, color: '#fef08a', textTransform: 'uppercase', marginRight: 8, letterSpacing: '0.04em' }}>
                  {routeResult.reason === 'ORIGIN_UNSAFE'
                    ? 'Origin Unsafe — Deployment Infeasible'
                    : routeResult.reason === 'DESTINATION_UNSAFE'
                    ? 'Destination Unsafe — Facility Inaccessible'
                    : 'No Safe Evacuation Route'}
                </span>
                <span style={{ color: '#fecaca' }}>{routeResult.message}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#fef08a', fontWeight: 800, background: 'rgba(0,0,0,0.35)', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>
              Threshold: &le;15.0 cm
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="map-container" style={{ flex: 1, position: 'relative' }}>
          <FloodMap
            nodes={nodes}
            edges={edges}
            routePath={routePath}
            showRoute={showRoute}
            chokeMode={chokeMode}
            blockedNodes={blockedNodes}
            onNodeClick={handleNodeClick}
            center={mapCenter}
            zoom={zoom}
            routeSource={routeSource}
            routeTarget={routeTarget}
          />

          {/* Map Color Legend */}
          <div className="map-legend">
            <div className="legend-title">Flood Depth & Risk Legend</div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ef4444' }} />
              <span>Critical (≥ 30 cm) · Submerged</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#f97316' }} />
              <span>High (20–30 cm) · Impassable</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#f59e0b' }} />
              <span>Medium (10–20 cm) · Caution</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#06b6d4' }} />
              <span>Low (3–10 cm) · Minor Runoff</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#10b981' }} />
              <span>Safe (&lt; 3 cm) · Free Flow</span>
            </div>
            <div style={{ margin: '6px 0 4px', borderTop: '1px solid var(--border-subtle)' }} />
            <div className="legend-item">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#6366f1', border: '2px solid white' }} />
              <span>🏥 Destination (Exit / Hospital)</span>
            </div>
            <div className="legend-item">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', border: '2px solid white' }} />
              <span>🚑 Dispatch Origin</span>
            </div>
            <div className="legend-item">
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px dashed #dc2626', background: 'rgba(239, 68, 68, 0.3)' }} />
              <span>🚫 Blocked Manhole (Choke)</span>
            </div>
            <div className="legend-item">
              <div style={{ width: 14, height: 2, borderTop: '1px dashed #3b82f6' }} />
              <span>Stormwater Drain / Sewer Conduit</span>
            </div>
            {showRoute && (
              <div className="legend-item">
                <div style={{ width: 14, height: 3, background: '#10b981', borderRadius: 2 }} />
                <span>Safe Ambulance Corridor (&lt;15cm)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Floating Alerts, Route & PySewer Panel */}
        <AlertPanel
          nodes={nodes}
          routeResult={routeResult}
          showRoute={showRoute}
        />

        {/* Bottom Status Bar with Honest Scientific Labels */}
        <footer className="status-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`status-dot ${isLiveConnected ? 'status-dot-live' : 'status-dot-offline'}`} />
            <span>
              {isLiveConnected
                ? 'FastAPI Hydro Engine · 1D Manning Pipe Flow & Overland Surcharge'
                : 'Offline Demo Mode · Local 1D Hydro Solver Active'}
            </span>
          </div>
          <div>
            Catchment: <strong style={{ color: 'var(--text-primary)' }}>Minto Bridge (28.6280° N, 77.2197° E)</strong> · 25 Nodes · 39 Links · Elevation 210.5m – 216.5m
          </div>
          <div>
            Storm Window: <strong style={{ color: 'var(--accent-cyan)' }}>{minutes} min</strong> · Blocked:{' '}
            <strong style={{ color: blockedNodes.length > 0 ? '#ef4444' : 'var(--text-primary)' }}>
              {blockedNodes.length}
            </strong>
          </div>
        </footer>
      </main>
    </div>
  );
}
