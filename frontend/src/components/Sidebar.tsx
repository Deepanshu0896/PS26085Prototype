/**
 * Agastya — Sidebar Component
 * Premium glassmorphic sidebar with brand, rainfall intensity slider,
 * storm duration accumulation slider, multi-node choke simulation controls,
 * dashboard KPIs, charts, and legend.
 */

import type { FloodSummary, RainResponse } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SidebarProps {
  rainMm: number;
  onRainChange: (value: number) => void;
  minutes: number;
  onMinutesChange: (value: number) => void;
  summary: FloodSummary | null;
  rainData: RainResponse | null;
  chokeMode: boolean;
  onChokeModeToggle: () => void;
  blockedNodes: string[];
  onClearBlockedNodes: () => void;
  onUnblockNode?: (id: string) => void;
  showRoute: boolean;
  onRouteToggle: () => void;
  routeSource: string;
  routeTarget: string;
  onRouteSourceChange: (v: string) => void;
  onRouteTargetChange: (v: string) => void;
  routeResult?: import('../lib/api').RouteResponse | null;
  nodes?: Array<{ node_id: string; name: string; depth_cm: number; risk_level: string }>;
  nodeList: { id: string; name: string }[];
  loading: boolean;
}

function getRainClass(mm: number): string {
  if (mm >= 60) return 'rain-extreme';
  if (mm >= 35) return 'rain-heavy';
  if (mm >= 15) return 'rain-moderate';
  return 'rain-low';
}

function getRainLabel(mm: number): string {
  if (mm >= 60) return '🌊 Extreme Downpour';
  if (mm >= 35) return '⛈️ Heavy Monsoon Rain';
  if (mm >= 15) return '🌧️ Moderate Rain';
  if (mm >= 1) return '🌦️ Light Rain';
  return '☀️ Dry / No Rain';
}

export default function Sidebar({
  rainMm,
  onRainChange,
  minutes,
  onMinutesChange,
  summary,
  rainData,
  chokeMode,
  onChokeModeToggle,
  blockedNodes,
  onClearBlockedNodes,
  onUnblockNode,
  showRoute,
  onRouteToggle,
  routeSource,
  routeTarget,
  onRouteSourceChange,
  onRouteTargetChange,
  routeResult = null,
  nodes = [],
  nodeList,
  loading,
}: SidebarProps) {
  const riskData = summary
    ? [
        { name: 'Critical', value: summary.risk_breakdown.CRITICAL, color: '#ef4444' },
        { name: 'High', value: summary.risk_breakdown.HIGH, color: '#f97316' },
        { name: 'Medium', value: summary.risk_breakdown.MEDIUM, color: '#f59e0b' },
        { name: 'Low', value: summary.risk_breakdown.LOW, color: '#06b6d4' },
        { name: 'Safe', value: summary.risk_breakdown.SAFE, color: '#10b981' },
      ]
    : [];

  const totalNodes = summary?.total_nodes || 1;

  return (
    <aside className="sidebar">
      {/* ─── Brand ─── */}
      <div className="sidebar-brand">
        <div className="brand-title">
          <div className="brand-icon">🌊</div>
          <div>
            <div className="brand-name">AGASTYA</div>
            <div className="brand-subtitle">Urban Flood Nowcasting</div>
          </div>
        </div>
      </div>

      {/* ─── Rainfall Intensity Slider ─── */}
      <div className="rain-slider-container">
        <div className="section-title">1. Rainfall Rate (Intensity)</div>
        <div className="slider-header">
          <div>
            <span className="slider-value">{rainMm}</span>
            <span className="slider-unit">mm/hr</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{getRainLabel(rainMm)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={rainMm}
          onChange={(e) => onRainChange(Number(e.target.value))}
          className={`rain-slider ${getRainClass(rainMm)}`}
          id="rain-slider"
        />
        <div className="slider-labels">
          <span>0mm</span>
          <span>25mm</span>
          <span>50mm</span>
          <span>75mm</span>
          <span>100mm</span>
        </div>

        {/* ─── Storm Duration Accumulation Slider ─── */}
        <div style={{ marginTop: 14 }}>
          <div className="section-title">2. Storm Duration (Accumulation Time)</div>
          <div className="slider-header" style={{ marginBottom: 4 }}>
            <div>
              <span className="slider-value" style={{ color: 'var(--accent-cyan)' }}>{minutes}</span>
              <span className="slider-unit">min</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Total Volume: {((rainMm * (minutes / 60)).toFixed(1))} mm total
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={minutes}
            onChange={(e) => onMinutesChange(Number(e.target.value))}
            className="rain-slider"
            style={{ background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }}
            id="duration-slider"
          />
          <div className="slider-labels" style={{ marginBottom: 8 }}>
            <span>5m</span>
            <span>30m</span>
            <span>60m</span>
            <span>90m</span>
            <span>120m</span>
          </div>
          {/* Quick preset buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[15, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMinutesChange(m)}
                style={{
                  flex: 1,
                  padding: '3px 0',
                  fontSize: 10,
                  borderRadius: 4,
                  border: minutes === m ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  background: minutes === m ? 'rgba(6, 182, 212, 0.2)' : 'var(--bg-glass)',
                  color: minutes === m ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: minutes === m ? 700 : 500,
                }}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Dashboard Stats ─── */}
      <div className="section-title" style={{ paddingLeft: 20 }}>Catchment Analytics (Hydraulic Estimate)</div>
      <div className="stats-grid">

        <div className="glass-card stat-red">
          <div className="glass-card-title">Max Depth</div>
          <div className="glass-card-value">
            {summary ? summary.max_depth_cm.toFixed(1) : '—'}
          </div>
          <div className="glass-card-label">cm (Underpass)</div>
        </div>
        <div className="glass-card stat-amber">
          <div className="glass-card-title">Avg Depth</div>
          <div className="glass-card-value">
            {summary ? summary.avg_depth_cm.toFixed(1) : '—'}
          </div>
          <div className="glass-card-label">cm (all streets)</div>
        </div>
        <div className="glass-card stat-blue">
          <div className="glass-card-title">Flooded</div>
          <div className="glass-card-value">
            {summary ? summary.flooded_nodes : '—'}
          </div>
          <div className="glass-card-label">
            of {summary ? summary.total_nodes : '—'} nodes
          </div>
        </div>
        <div className="glass-card stat-cyan">
          <div className="glass-card-title">Avg Flooded</div>
          <div className="glass-card-value">
            {summary ? summary.avg_flooded_depth_cm.toFixed(1) : '—'}
          </div>
          <div className="glass-card-label">cm depth</div>
        </div>
      </div>

      {/* ─── Risk Breakdown Chart ─── */}
      {summary && (
        <div className="sidebar-section">
          <div className="section-title">Risk Severity Breakdown</div>
          <div className="glass-card" style={{ padding: 8 }}>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={riskData} barSize={22}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Mini risk bar */}
            <div className="risk-breakdown">
              {summary.risk_breakdown.CRITICAL > 0 && (
                <div className="risk-bar risk-bar-critical"
                  style={{ width: `${(summary.risk_breakdown.CRITICAL / totalNodes) * 100}%` }} />
              )}
              {summary.risk_breakdown.HIGH > 0 && (
                <div className="risk-bar risk-bar-high"
                  style={{ width: `${(summary.risk_breakdown.HIGH / totalNodes) * 100}%` }} />
              )}
              {summary.risk_breakdown.MEDIUM > 0 && (
                <div className="risk-bar risk-bar-medium"
                  style={{ width: `${(summary.risk_breakdown.MEDIUM / totalNodes) * 100}%` }} />
              )}
              {summary.risk_breakdown.LOW > 0 && (
                <div className="risk-bar risk-bar-low"
                  style={{ width: `${(summary.risk_breakdown.LOW / totalNodes) * 100}%` }} />
              )}
              {summary.risk_breakdown.SAFE > 0 && (
                <div className="risk-bar risk-bar-safe"
                  style={{ width: `${(summary.risk_breakdown.SAFE / totalNodes) * 100}%` }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Controls ─── */}
      <div className="sidebar-section">
        <div className="section-title">Simulation Controls</div>

        {/* Choke mode toggle */}
        <div className="glass-card" style={{ borderColor: chokeMode ? 'rgba(239, 68, 68, 0.4)' : undefined }}>
          <div className="toggle-container">
            <span className="toggle-label" style={{ fontWeight: 600 }}>
              🔴 Choke Simulation (Multi-Node)
            </span>
            <div
              className={`toggle-switch ${chokeMode ? 'active' : ''}`}
              onClick={onChokeModeToggle}
              style={{ background: chokeMode ? '#ef4444' : undefined }}
              id="choke-toggle"
            />
          </div>

          {chokeMode && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: blockedNodes.length > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                  {blockedNodes.length > 0
                    ? `🚫 ${blockedNodes.length} Manhole${blockedNodes.length > 1 ? 's' : ''} Blocked`
                    : 'Click any nodes on map to block'}
                </span>
                {blockedNodes.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearBlockedNodes}
                    className="btn btn-sm"
                    style={{
                      padding: '2px 8px',
                      fontSize: 10,
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {blockedNodes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '6px 0 8px', maxHeight: 120, overflowY: 'auto' }}>
                  {blockedNodes.map(id => {
                    const nodeName = nodeList.find(n => n.id === id)?.name || id;
                    return (
                      <div
                        key={id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontSize: 11,
                        }}
                      >
                        <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: 10 }}>🚫 {nodeName}</span>
                        {onUnblockNode && (
                          <button
                            type="button"
                            onClick={() => onUnblockNode(id)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              padding: '2px 6px',
                              fontSize: 9,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Unblock
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Click any manhole markers on the map to block or unblock. Multiple manholes can be blocked simultaneously to simulate network-wide silt clogs.
              </div>
            </div>
          )}

          {!chokeMode && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              Enable to simulate debris & silt blockages across multiple manholes.
            </div>
          )}
        </div>

        {/* Route toggle */}
        <div className="glass-card">
          <div className="toggle-container">
            <span className="toggle-label" style={{ fontWeight: 600 }}>🚑 Safe Ambulance Corridor</span>
            <div
              className={`toggle-switch ${showRoute ? 'active' : ''}`}
              onClick={onRouteToggle}
              id="route-toggle"
            />
          </div>
          {showRoute && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Origin Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                  htmlFor="route-source"
                  style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span>Dispatch Origin</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="route-source"
                    value={routeSource}
                    onChange={(e) => onRouteSourceChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      color: '#f1f5f9',
                      fontSize: 12,
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {nodeList.map(n => (
                      <option key={n.id} value={n.id} style={{ background: '#0f172a', color: '#f1f5f9' }}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Real-time origin flood depth indicator */}
                {(() => {
                  const originNode = nodes.find(n => n.node_id === routeSource);
                  if (!originNode) return null;
                  const isUnsafe = originNode.depth_cm > 15.0;
                  return (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: isUnsafe ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                        border: `1px solid ${isUnsafe ? '#ef4444' : 'rgba(16, 185, 129, 0.3)'}`,
                        marginTop: 2,
                      }}
                    >
                      <span style={{ color: isUnsafe ? '#fca5a5' : '#6ee7b7', fontWeight: 600 }}>
                        {isUnsafe ? '🚨 ORIGIN UNSAFE (Submerged)' : '🟢 Passable Origin'}
                      </span>
                      <span style={{ fontWeight: 800, color: isUnsafe ? '#ef4444' : '#10b981' }}>
                        {originNode.depth_cm.toFixed(1)} cm
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Swap Origin & Destination Button */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '-2px 0' }}>
                <button
                  type="button"
                  onClick={() => {
                    const temp = routeSource;
                    onRouteSourceChange(routeTarget);
                    onRouteTargetChange(temp);
                  }}
                  title="Swap Origin and Destination"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 6,
                    color: '#94a3b8',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#38bdf8';
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <span>⇅</span>
                  <span>Swap Direction</span>
                </button>
              </div>

              {/* Destination Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                  htmlFor="route-target"
                  style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                  <span>Destination (Emergency Facility / Exit)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="route-target"
                    value={routeTarget}
                    onChange={(e) => onRouteTargetChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8,
                      color: '#f1f5f9',
                      fontSize: 12,
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {nodeList.map(n => (
                      <option key={n.id} value={n.id} style={{ background: '#0f172a', color: '#f1f5f9' }}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Real-time destination flood depth indicator */}
                {(() => {
                  const targetNode = nodes.find(n => n.node_id === routeTarget);
                  if (!targetNode) return null;
                  const isUnsafe = targetNode.depth_cm > 15.0;
                  return (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: isUnsafe ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                        border: `1px solid ${isUnsafe ? '#ef4444' : 'rgba(99, 102, 241, 0.3)'}`,
                        marginTop: 2,
                      }}
                    >
                      <span style={{ color: isUnsafe ? '#fca5a5' : '#a5b4fc', fontWeight: 600 }}>
                        {isUnsafe ? '🚨 DESTINATION UNSAFE (Inaccessible)' : '🔵 Destination Passable'}
                      </span>
                      <span style={{ fontWeight: 800, color: isUnsafe ? '#ef4444' : '#818cf8' }}>
                        {targetNode.depth_cm.toFixed(1)} cm
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Dedicated Route Result Status Card */}
              {routeResult && !routeResult.reachable && (
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid #ef4444',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>⛔</span>
                    <span>
                      {routeResult.reason === 'ORIGIN_UNSAFE'
                        ? 'Origin Unsafe — Cannot Deploy'
                        : routeResult.reason === 'DESTINATION_UNSAFE'
                        ? 'Destination Unsafe — Inaccessible'
                        : 'No Safe Evacuation Path'}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#fca5a5', lineHeight: 1.35 }}>
                    {routeResult.message}
                  </div>
                  <div style={{ fontSize: 9.5, color: '#fecaca', fontWeight: 700 }}>
                    Vehicle Water Clearance Limit: &le;15.0 cm
                  </div>
                </div>
              )}

              {routeResult && routeResult.reachable && (
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>🚑</span>
                    <span>Safe Corridor Found</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1' }}>
                    <span>Dist: <strong>{(routeResult.distance_m / 1000).toFixed(2)} km</strong></span>
                    <span>ETA: <strong>{Math.ceil(routeResult.eta_safe_sec / 60)} min</strong></span>
                    <span>Avoided: <strong style={{ color: '#ef4444' }}>{routeResult.blocked_count} sectors</strong></span>
                  </div>
                </div>
              )}

              {/* Live Guidance Tip */}
              <div style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span>🛡️</span>
                <span>Dijkstra avoids roads &gt;15 cm (Configurable vehicle clearance threshold)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Live Rain Data ─── */}
      {rainData && (
        <div className="sidebar-section">
          <div className="section-title">Live Weather Feed</div>
          <div className="glass-card stat-cyan">
            <div className="glass-card-title">Current Rain (Open-Meteo)</div>
            <div className="glass-card-value">{rainData.current_rain_mm}</div>
            <div className="glass-card-label">mm/hr at Minto Bridge</div>
          </div>
          <div className="glass-card">
            <div className="glass-card-title">Atmospheric Conditions</div>
            <div className="glass-card-value" style={{ color: 'var(--accent-amber)', fontSize: 18 }}>
              {rainData.current_temperature_c}°C
            </div>
            <div className="glass-card-label">Wind: {rainData.wind_speed_kmh} km/h</div>
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <div style={{
        marginTop: 'auto',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          SIH 2026 · Problem Statement 26085
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
          Synthetic Drainage Proxy (PySewer) · DEM Elevations
        </div>
        <div style={{ fontSize: 9, color: '#38bdf8', marginTop: 1, fontWeight: 600 }}>
          Minto Bridge, New Delhi · {loading ? '⏳ Computing...' : '✅ Online'}
        </div>
      </div>
    </aside>
  );
}

