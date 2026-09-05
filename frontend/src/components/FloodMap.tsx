/**
 * Agastya — FloodMap Component
 * Interactive Leaflet map with flood depth colour overlays,
 * manhole markers, pipe network lines, multi-node choke indicators, and route visualization.
 */

import { useEffect, Fragment } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { NodeDepth, NetworkEdge, PathCoord } from '../lib/api';

interface FloodMapProps {
  nodes: NodeDepth[];
  edges: NetworkEdge[];
  routePath: PathCoord[];
  showRoute: boolean;
  chokeMode: boolean;
  blockedNodes: string[];
  onNodeClick: (nodeId: string) => void;
  center: [number, number];
  zoom: number;
  routeSource?: string;
  routeTarget?: string;
}

// Flood depth → colour mapping (matches standard hydrological risk legend)
function getDepthColor(depth: number): string {
  if (depth >= 30) return '#ef4444';   // CRITICAL — red
  if (depth >= 20) return '#f97316';   // HIGH — orange
  if (depth >= 10) return '#f59e0b';   // MEDIUM — amber
  if (depth >= 3) return '#06b6d4';    // LOW — cyan
  return '#10b981';                     // SAFE — green
}

function getDepthRadius(depth: number): number {
  if (depth >= 30) return 14;
  if (depth >= 20) return 12;
  if (depth >= 10) return 10;
  if (depth >= 3) return 8;
  return 6;
}

function getDepthOpacity(depth: number): number {
  if (depth >= 30) return 0.9;
  if (depth >= 20) return 0.8;
  if (depth >= 10) return 0.7;
  if (depth >= 3) return 0.6;
  return 0.4;
}

// Component to handle map view updates
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function FloodMap({
  nodes,
  edges,
  routePath,
  showRoute,
  chokeMode,
  blockedNodes,
  onNodeClick,
  center,
  zoom,
  routeSource,
  routeTarget,
}: FloodMapProps) {
  const blockedSet = new Set(blockedNodes);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="leaflet-container"
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      {/* Dark map tiles (ESRI Dark Gray Canvas - No API key required) */}
      <TileLayer
        attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={18}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        maxZoom={18}
        opacity={0.7}
      />

      <MapUpdater center={center} zoom={zoom} />

      {/* Pipe network lines */}
      {edges.map((edge, i) => (
        <Polyline
          key={`edge-${i}`}
          positions={[
            [edge.from_lat, edge.from_lon],
            [edge.to_lat, edge.to_lon],
          ]}
          pathOptions={{
            color: 'rgba(59, 130, 246, 0.25)',
            weight: 1.5,
            dashArray: '4 4',
          }}
        />
      ))}

      {/* Safe ambulance route */}
      {showRoute && routePath.length > 1 && (
        <>
          <Polyline
            positions={routePath.map(p => [p.lat, p.lon] as [number, number])}
            pathOptions={{
              color: '#10b981',
              weight: 6,
              opacity: 0.95,
              dashArray: undefined,
            }}
          />

          {/* Route START Marker (Origin) — Emerald Green */}
          <CircleMarker
            center={[routePath[0].lat, routePath[0].lon]}
            radius={12}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#10b981',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]} className="route-tooltip-start">
              🚑 DISPATCH: {routePath[0].name}
            </Tooltip>
          </CircleMarker>

          {/* Route END Marker (Destination) — Distinct Royal Indigo / Blue (NOT red, prevents flood confusion!) */}
          <CircleMarker
            center={[routePath[routePath.length - 1].lat, routePath[routePath.length - 1].lon]}
            radius={12}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#6366f1',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]} className="route-tooltip-end">
              🏥 DESTINATION: {routePath[routePath.length - 1].name}
            </Tooltip>
          </CircleMarker>
        </>
      )}

      {/* Flood depth markers + blocked halos — Fragment avoids invalid DOM nesting in Leaflet */}
      {nodes.map((node) => {
        const isBlocked = blockedSet.has(node.node_id);
        const isSource = node.node_id === routeSource;
        const isTarget = node.node_id === routeTarget;
        const isEndpoint = isSource || isTarget;
        const radius = getDepthRadius(node.depth_cm);

        return (
          <Fragment key={node.node_id}>
            {/* Outer halo ring for blocked nodes */}
            {isBlocked && (
              <CircleMarker
                center={[node.lat, node.lon]}
                radius={radius + 11}
                pathOptions={{
                  color: '#dc2626',
                  fillColor: '#ef4444',
                  fillOpacity: 0.15,
                  weight: 2.5,
                  dashArray: '5 4',
                  opacity: 0.8,
                  interactive: false,
                }}
              />
            )}

            {/* Inner halo ring for blocked nodes */}
            {isBlocked && (
              <CircleMarker
                center={[node.lat, node.lon]}
                radius={radius + 6}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#dc2626',
                  fillOpacity: 0.1,
                  weight: 1.5,
                  dashArray: '3 3',
                  opacity: 0.6,
                  interactive: false,
                }}
              />
            )}

            {/* Distinct indicator ring for routing endpoints */}
            {isEndpoint && (
              <CircleMarker
                center={[node.lat, node.lon]}
                radius={radius + 6}
                pathOptions={{
                  color: isSource ? '#10b981' : '#6366f1',
                  fillOpacity: 0,
                  weight: 2.5,
                  dashArray: '2 2',
                  interactive: false,
                }}
              />
            )}

            {/* Main node marker */}
            <CircleMarker
              center={[node.lat, node.lon]}
              radius={isBlocked ? radius + 3 : radius}
              pathOptions={{
                color: isBlocked ? '#ffffff' : isEndpoint ? (isSource ? '#10b981' : '#6366f1') : getDepthColor(node.depth_cm),
                fillColor: isBlocked ? '#dc2626' : getDepthColor(node.depth_cm),
                fillOpacity: isBlocked ? 0.95 : getDepthOpacity(node.depth_cm),
                weight: isBlocked || isEndpoint ? 3 : 2,
                opacity: 0.9,
              }}
              eventHandlers={{
                click: () => onNodeClick(node.node_id),
              }}
            >
              <Popup>
                <div className="popup-content">
                  <div className="popup-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span>{isBlocked ? `🚫 [BLOCKED] ${node.name}` : node.name}</span>
                    {isEndpoint && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: isSource ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)',
                          color: isSource ? '#34d399' : '#818cf8',
                          border: `1px solid ${isSource ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.4)'}`,
                        }}
                      >
                        {isSource ? '🚑 ORIGIN' : '🏥 DESTINATION'}
                      </span>
                    )}
                  </div>
                  <div className="popup-stat">
                    <span>Water Depth</span>
                    <span className="popup-stat-value" style={{ color: isBlocked ? '#ef4444' : undefined, fontWeight: 800 }}>
                      {node.depth_cm.toFixed(1)} cm
                    </span>
                  </div>
                  <div className="popup-stat">
                    <span>Flood Risk</span>
                    <span className={`popup-risk risk-${node.risk_level}`} style={{ fontWeight: 800 }}>
                      {node.risk_level}
                    </span>
                  </div>
                  <div className="popup-stat">
                    <span>Role / Type</span>
                    <span className="popup-stat-value" style={{ textTransform: 'capitalize' }}>
                      {node.role || 'Junction'}
                    </span>
                  </div>
                  <div className="popup-stat">
                    <span>Coordinates</span>
                    <span className="popup-stat-value">{node.lat.toFixed(4)}°N, {node.lon.toFixed(4)}°E</span>
                  </div>

                  {isEndpoint && (
                    <div className="popup-stat" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4, marginTop: 4 }}>
                      <span>Routing Status</span>
                      <span
                        className="popup-stat-value"
                        style={{
                          color: node.depth_cm > 15.0 ? '#ef4444' : isSource ? '#10b981' : '#818cf8',
                          fontWeight: 800,
                        }}
                      >
                        {node.depth_cm > 15.0 ? '⚠️ UNSAFE (>15.0 cm)' : '✅ PASSABLE (≤15.0 cm)'}
                      </span>
                    </div>
                  )}

                  {(chokeMode || isBlocked) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isEndpoint || isBlocked) {
                          onNodeClick(node.node_id);
                        }
                      }}
                      style={{
                        marginTop: 8,
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        background: (isEndpoint && !isBlocked)
                          ? 'rgba(148, 163, 184, 0.15)'
                          : isBlocked
                          ? '#10b981'
                          : '#ef4444',
                        color: 'white',
                        textAlign: 'center',
                        cursor: (isEndpoint && !isBlocked) ? 'not-allowed' : 'pointer',
                        border: 'none',
                        boxShadow: isBlocked ? '0 0 10px rgba(16, 185, 129, 0.4)' : '0 0 10px rgba(239, 68, 68, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      {isBlocked
                        ? '🟢 Click to Unblock Manhole'
                        : isEndpoint
                        ? '🛡️ Routing endpoint — cannot be blocked'
                        : '🔴 Click to Block Manhole (Choke)'}
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
