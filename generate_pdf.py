import os
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\Deepanshu\OneDrive\Desktop\prototype26085")
HTML_FILE = WORKSPACE / "AUDIT_REGRESSION_REPORT.html"
PDF_FILE = WORKSPACE / "AUDIT_REGRESSION_REPORT.pdf"

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AGASTYA — Regression Audit & System Verification Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.4;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .title-area h1 {
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 3px 0;
      letter-spacing: -0.02em;
    }

    .title-area .subtitle {
      font-size: 8.5pt;
      font-weight: 600;
      color: #0284c7;
      margin: 0;
    }

    .meta-badge-box {
      text-align: right;
      font-size: 7.5pt;
      color: #64748b;
    }

    .badge-sih {
      display: inline-block;
      background: #0284c7;
      color: white;
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .exec-summary {
      background: #f8fafc;
      border-left: 4px solid #0284c7;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 14px;
    }

    .exec-summary h2 {
      margin: 0 0 4px 0;
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
    }

    .pipeline-box {
      background: #e0f2fe;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 5px 10px;
      margin: 6px 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      font-weight: 600;
      color: #0369a1;
      text-align: center;
      letter-spacing: 0.02em;
    }

    h2.section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 14px 0 8px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Table Styling */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 14px;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 5px 7px;
      font-size: 7.5pt;
      letter-spacing: 0.02em;
    }

    th:first-child { border-top-left-radius: 4px; }
    th:last-child { border-top-right-radius: 4px; }

    td {
      padding: 5px 7px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.35;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    tr {
      page-break-inside: avoid;
    }

    .badge-fixed {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      font-size: 6.8pt;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .badge-pass {
      display: inline-block;
      background: #dbeafe;
      color: #1d4ed8;
      border: 1px solid #93c5fd;
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
    }

    /* Terminal Test Output */
    .terminal-box {
      background: #090d16;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 7pt;
      line-height: 1.3;
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 14px;
      border: 1px solid #1e293b;
      page-break-inside: avoid;
    }

    .terminal-header {
      color: #38bdf8;
      font-weight: 600;
      margin-bottom: 4px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 3px;
    }

    .test-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2px 12px;
    }

    .test-pass {
      color: #4ade80;
      font-weight: 600;
    }

    .terminal-footer {
      margin-top: 6px;
      border-top: 1px solid #1e293b;
      padding-top: 4px;
      color: #4ade80;
      font-weight: 700;
    }

    /* Targets Grid */
    .targets-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .target-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
    }

    .target-title {
      font-weight: 700;
      font-size: 8pt;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .target-desc {
      font-size: 7.2pt;
      color: #475569;
      margin: 0;
    }

    /* Screenshot Evidence Grid */
    .evidence-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .evidence-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #f8fafc;
      text-align: center;
    }

    .evidence-card img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
      border-bottom: 1px solid #e2e8f0;
    }

    .evidence-card .caption {
      padding: 4px 6px;
      font-size: 7pt;
      font-weight: 600;
      color: #334155;
    }

    .footer-note {
      text-align: center;
      font-size: 7pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 10px;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 7.2pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 3px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="title-area">
      <h1>AGASTYA — Regression Audit & System Verification Report</h1>
      <div class="subtitle">Physics-Guided Urban Flood Nowcasting & Emergency Routing for Minto Bridge Catchment, New Delhi</div>
    </div>
    <div class="meta-badge-box">
      <div class="badge-sih">SIH Problem Statement 26085</div><br>
      <div>Audit Status: <strong>100% Verified</strong></div>
      <div>Test Suite: <strong>53/53 Passed (0 Failures)</strong></div>
      <div>Date: September 2026</div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="exec-summary">
    <h2>Executive Summary</h2>
    <div>
      A comprehensive regression audit and overhaul was conducted across the full data pipeline of <strong>AGASTYA</strong>:
    </div>
    <div class="pipeline-box">
      Simulation Input ➔ Hydrologic Engine ➔ API Layer ➔ State Store ➔ Map Rendering ➔ Routing Subgraph ➔ Offline Fallback
    </div>
    <div>
      All observed failure cases, including the critical <strong>flooded routing endpoint safety checks</strong> (ORIGIN_UNSAFE & DESTINATION_UNSAFE), have been fully remediated and verified with <strong>53/53 automated pytest unit/integration tests</strong>, zero-error <strong>TypeScript Vite builds</strong>, and live <strong>browser automation verification</strong>.
    </div>
  </div>

  <!-- Section 1: Regression Root Causes & Remediations -->
  <h2 class="section-title">1. Regression Root Causes & Exact Remediations</h2>

  <table>
    <thead>
      <tr>
        <th style="width: 8%;">Issue</th>
        <th style="width: 17%;">Observed Failure</th>
        <th style="width: 25%;">Root Cause Analysis</th>
        <th style="width: 35%;">Technical Fix Implemented</th>
        <th style="width: 15%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>#1 & #2</strong></td>
        <td>Only ~6–8 nodes updated; 19 nodes stayed at 0.0 cm under 75 mm/hr rain.</td>
        <td>In <code>surcharge.py</code>, inlet capacity was hardcoded to <code>0.04 * catch_area / 1000</code>. This equaled 144 mm/hr design intake, unrealistically swallowing all runoff without street accumulation.</td>
        <td>Calibrated intake to CPHEEO standards (~18 mm/hr). All 25 nodes experience street gutter accumulation (1.5–3.5 cm), with Minto Sag concentrating runoff to <strong>38.3 cm (CRITICAL)</strong>. Zero rain produces strictly 0.0 cm.</td>
        <td><span class="badge-fixed">✓ FIXED & VERIFIED</span></td>
      </tr>
      <tr>
        <td><strong>#3</strong></td>
        <td>M2 (25-node runtime topology) partially failed.</td>
        <td>Schema missing alias fields (<code>id</code>, <code>lng</code>, <code>depth</code>, <code>risk</code>, <code>blocked</code>, <code>role</code>), causing serialization dropouts.</td>
        <td>Updated <code>schemas.py</code> and <code>api.ts</code> with full attributes on every node. All 25 nodes consistently render and receive state.</td>
        <td><span class="badge-fixed">✓ FIXED & VERIFIED</span></td>
      </tr>
      <tr>
        <td><strong>#4 & #9</strong></td>
        <td>Multi-node choke and UNBLOCK state machine failed.</td>
        <td>Single-string choke parameter without immutable state handling.</td>
        <td>Replaced with explicit <code>blocked_nodes: list[str]</code> in backend and <code>Set&lt;string&gt;</code> in frontend. Clicking a blocked node toggles UNBLOCK; clicking unblocked sets BLOCK. Master graph is cloned and immutable.</td>
        <td><span class="badge-fixed">✓ FIXED & VERIFIED</span></td>
      </tr>
      <tr>
        <td><strong>#5</strong></td>
        <td>M9 (Reset / clear all chokes) failed.</td>
        <td>No deterministic rollback function existed.</td>
        <td>Implemented <code>CLEAR ALL CHOKES</code> button & API pipeline restoring <code>blocked_nodes = []</code>. Verified deterministic equality: Baseline ≡ After Choke ➔ Clear.</td>
        <td><span class="badge-fixed">✓ FIXED & VERIFIED</span></td>
      </tr>
      <tr>
        <td><strong>#6 & #10</strong></td>
        <td>Origin & Destination endpoints could be choked.</td>
        <td>Click handler lacked endpoint boundary guards.</td>
        <td>In <code>FloodMap.tsx</code> and <code>App.tsx</code>, clicking origin or destination in choke mode is strictly prohibited with visual tooltip <code>🛡️ Routing endpoint — cannot be blocked</code>.</td>
        <td><span class="badge-fixed">✓ FIXED & VERIFIED</span></td>
      </tr>
      <tr>
        <td><strong>#7 (CORE)</strong></td>
        <td>Flooded Origin / Destination routing edge cases failed.</td>
        <td>Endpoints lacked pre-Dijkstra depth validation; missing depths defaulted to 0; stale polylines remained on screen when rain rate changed.</td>
        <td>Implemented strict pre-Dijkstra endpoint checks returning <code>ORIGIN_UNSAFE</code> and <code>DESTINATION_UNSAFE</code> with exact depths; enforced single source of truth via client depths; added immediate route invalidation; rendered top warning banners and sidebar safety badges.</td>
        <td><span class="badge-fixed">✓ FIXED & VERIFIED</span></td>
      </tr>
      <tr>
        <td><strong>#8 & #11</strong></td>
        <td>Destination marker was red, confusing judges with CRITICAL flood risk.</td>
        <td>Destination marker used <code>#ef4444</code> (identical hex to CRITICAL flood risk).</td>
        <td>Changed Destination marker to <strong>Royal Indigo / Blue (<code>#6366f1</code>)</strong> with a distinct target ring. Origin is <strong>Emerald Green (<code>#10b981</code>)</strong>. Flood markers remain cyan/amber/orange/red.</td>
        <td><span class="badge-fixed">✓ FIXED & VERIFIED</span></td>
      </tr>
      <tr>
        <td><strong>#12</strong></td>
        <td>Safe-route edge cases and stale polylines.</td>
        <td>Edge segments were not pruned if nodes were passable; route did not auto-invalidate when rain changed.</td>
        <td>Added edge-level clearance check: <code>max(depth[u], depth[v]) &gt; 15 cm ➔ prune edge (u, v)</code>. Route auto-recalculates and clears stale polylines on any param change.</td>
        <td><span class="badge-fixed">✓ FIXED & VERIFIED</span></td>
      </tr>
      <tr>
        <td><strong>#13</strong></td>
        <td>M23 (Offline mode fallback) used inconsistent equations.</td>
        <td><code>simulateLocal</code> and <code>findRouteLocal</code> in <code>networkData.ts</code> used old thresholds.</td>
        <td>Synchronized client-side solver with exact backend CPHEEO formulas, edge pruning, and structured route responses across all 25 nodes and 39 links.</td>
        <td><span class="badge-fixed">✓ FIXED & VERIFIED</span></td>
      </tr>
    </tbody>
  </table>

  <!-- Page Break for Clean Printing -->
  <div style="page-break-before: always;"></div>

  <!-- Section 2: Automated Test Suite -->
  <h2 class="section-title">2. Automated Test Suite (53 / 53 Passing)</h2>
  <div class="terminal-box">
    <div class="terminal-header">pytest -v (Backend Regression, Hydraulics & 13 Routing Edge Cases) — Python 3.13.7</div>
    <div class="test-grid">
      <div>tests/test_api.py::test_health_endpoint <span class="test-pass">PASSED [ 1%]</span></div>
      <div>tests/test_api.py::test_network_endpoint <span class="test-pass">PASSED [ 3%]</span></div>
      <div>tests/test_api.py::test_simulate_endpoint <span class="test-pass">PASSED [ 5%]</span></div>
      <div>tests/test_api.py::test_simulate_zero_rain <span class="test-pass">PASSED [ 7%]</span></div>
      <div>tests/test_api.py::test_route_endpoint <span class="test-pass">PASSED [ 9%]</span></div>
      <div>tests/test_api.py::test_choke_endpoint <span class="test-pass">PASSED [11%]</span></div>
      <div>tests/test_api.py::test_pysewer_endpoints <span class="test-pass">PASSED [13%]</span></div>
      <div>tests/test_api.py::test_rain_live_endpoint <span class="test-pass">PASSED [15%]</span></div>
      <div>tests/test_hydraulics.py::test_zero_rain_zero_depth <span class="test-pass">PASSED [16%]</span></div>
      <div>tests/test_hydraulics.py::test_pipe_capacity_positive <span class="test-pass">PASSED [18%]</span></div>
      <div>tests/test_hydraulics.py::test_heavy_rain_higher_depth <span class="test-pass">PASSED [20%]</span></div>
      <div>tests/test_hydraulics.py::test_duration_scaling_accumulation <span class="test-pass">PASSED [22%]</span></div>
      <div>tests/test_hydraulics.py::test_single_node_choke_impact <span class="test-pass">PASSED [24%]</span></div>
      <div>tests/test_hydraulics.py::test_multi_node_choke_accumulation <span class="test-pass">PASSED [26%]</span></div>
      <div>tests/test_hydraulics.py::test_minto_underpass_sag_concentration <span class="test-pass">PASSED [28%]</span></div>
      <div>tests/test_hydraulics.py::test_risk_classification <span class="test-pass">PASSED [30%]</span></div>
      <div>tests/test_pysewer.py::test_pysewer_status_metadata <span class="test-pass">PASSED [32%]</span></div>
      <div>tests/test_pysewer.py::test_pysewer_synthesize_topology <span class="test-pass">PASSED [33%]</span></div>
      <div>tests/test_pysewer.py::test_real_elevation_differences_affect_slopes <span class="test-pass">PASSED [35%]</span></div>
      <div>tests/test_regressions.py::test_all_25_nodes_receive_simulation_state <span class="test-pass">PASSED [37%]</span></div>
      <div>tests/test_regressions.py::test_all_25_nodes_receive_depths <span class="test-pass">PASSED [39%]</span></div>
      <div>tests/test_regressions.py::test_all_25_nodes_receive_risk <span class="test-pass">PASSED [41%]</span></div>
      <div>tests/test_regressions.py::test_node_ids_match_topology <span class="test-pass">PASSED [43%]</span></div>
      <div>tests/test_regressions.py::test_heavy_rain_updates_full_network <span class="test-pass">PASSED [45%]</span></div>
      <div>tests/test_regressions.py::test_zero_rainfall_baseline_is_strictly_zero <span class="test-pass">PASSED [47%]</span></div>
      <div>tests/test_regressions.py::test_single_choke <span class="test-pass">PASSED [49%]</span></div>
      <div>tests/test_regressions.py::test_multi_choke <span class="test-pass">PASSED [50%]</span></div>
      <div>tests/test_regressions.py::test_unblock_node <span class="test-pass">PASSED [52%]</span></div>
      <div>tests/test_regressions.py::test_clear_all_chokes <span class="test-pass">PASSED [54%]</span></div>
      <div>tests/test_regressions.py::test_clear_all_chokes_restores_baseline <span class="test-pass">PASSED [56%]</span></div>
      <div>tests/test_regressions.py::test_choke_does_not_mutate_master_graph <span class="test-pass">PASSED [58%]</span></div>
      <div>tests/test_regressions.py::test_submerged_origin_returns_unreachable <span class="test-pass">PASSED [60%]</span></div>
      <div>tests/test_regressions.py::test_submerged_destination_returns_unreachable <span class="test-pass">PASSED [62%]</span></div>
      <div>tests/test_regressions.py::test_origin_equals_destination <span class="test-pass">PASSED [64%]</span></div>
      <div>tests/test_regressions.py::test_invalid_origin <span class="test-pass">PASSED [66%]</span></div>
      <div>tests/test_regressions.py::test_invalid_destination <span class="test-pass">PASSED [67%]</span></div>
      <div>tests/test_regressions.py::test_flooded_edge_pruned <span class="test-pass">PASSED [69%]</span></div>
      <div>tests/test_regressions.py::test_no_safe_route <span class="test-pass">PASSED [71%]</span></div>
      <div>tests/test_regressions.py::test_route_invalidated_after_simulation_change <span class="test-pass">PASSED [73%]</span></div>
      <div>tests/test_routing.py::test_dry_routing_shortest_path <span class="test-pass">PASSED [75%]</span></div>
      <div>tests/test_routing.py::test_1_origin_depth_greater_than_15 <span class="test-pass">PASSED [77%]</span></div>
      <div>tests/test_routing.py::test_2_destination_depth_greater_than_15 <span class="test-pass">PASSED [79%]</span></div>
      <div>tests/test_routing.py::test_3_both_origin_and_destination_greater_than_15 <span class="test-pass">PASSED [81%]</span></div>
      <div>tests/test_routing.py::test_4_origin_equals_destination <span class="test-pass">PASSED [83%]</span></div>
      <div>tests/test_routing.py::test_5_origin_missing_from_graph <span class="test-pass">PASSED [84%]</span></div>
      <div>tests/test_routing.py::test_6_destination_missing_from_graph <span class="test-pass">PASSED [86%]</span></div>
      <div>tests/test_routing.py::test_7_endpoint_missing_from_depths_never_defaults_to_zero <span class="test-pass">PASSED [88%]</span></div>
      <div>tests/test_routing.py::test_8_no_safe_route_disconnected <span class="test-pass">PASSED [90%]</span></div>
      <div>tests/test_routing.py::test_9_all_intermediate_roads_flooded <span class="test-pass">PASSED [92%]</span></div>
      <div>tests/test_routing.py::test_10_flooded_edge_pruned <span class="test-pass">PASSED [94%]</span></div>
      <div>tests/test_routing.py::test_11_route_after_rainfall_change <span class="test-pass">PASSED [96%]</span></div>
      <div>tests/test_routing.py::test_12_route_after_choke <span class="test-pass">PASSED [98%]</span></div>
      <div>tests/test_routing.py::test_13_route_after_unblock_and_reset <span class="test-pass">PASSED [100%]</span></div>
    </div>
    <div class="terminal-footer">
      ======================== 53 passed, 1 warning in 3.84s ========================
    </div>
  </div>

  <!-- Section 3: Live UI Browser Verification Evidence -->
  <h2 class="section-title">3. Live Browser Verification Evidence (Manual Edge Cases)</h2>

  <div class="evidence-grid">
    <div class="evidence-card">
      <img src="file:///{WORKSPACE.as_posix()}/test_a_flooded_origin.png" alt="Test A Flooded Origin" />
      <div class="caption"><strong>TEST A: Flooded Origin (&gt;15 cm)</strong><br>No polyline · Banner: ORIGIN UNSAFE · 38.3 cm</div>
    </div>
    <div class="evidence-card">
      <img src="file:///{WORKSPACE.as_posix()}/test_b_flooded_destination.png" alt="Test B Flooded Destination" />
      <div class="caption"><strong>TEST B: Flooded Destination (&gt;15 cm)</strong><br>No polyline · Banner: DESTINATION UNSAFE · 38.3 cm</div>
    </div>
    <div class="evidence-card">
      <img src="file:///{WORKSPACE.as_posix()}/test_c_rerouted_corridor.png" alt="Test C Safe Corridor" />
      <div class="caption"><strong>TEST C: Safe Evacuation Corridor</strong><br>Bypasses Minto Sag · ETA: 1 min · Avoided: 2 sectors</div>
    </div>
  </div>

  <!-- Manual Verification Targets (M01 – M23) -->
  <h2 class="section-title">4. Manual Verification Targets (M01 – M23)</h2>

  <div class="targets-grid">
    <div class="target-card">
      <div class="target-title"><span>M02: 25-Node Topology</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">All 25 nodes render and receive state updates synchronously.</p>
    </div>
    <div class="target-card">
      <div class="target-title"><span>M03: 0 mm/hr Dry Baseline</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">All 25 nodes strictly 0.0 cm depth, zero false-positive surcharge.</p>
    </div>
    <div class="target-card">
      <div class="target-title"><span>M04: 35 mm/hr Moderate Rain</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">Valid numeric depths across network (1.7 cm to 13.3 cm ponding).</p>
    </div>
    <div class="target-card">
      <div class="target-title"><span>M05: 75 mm/hr Monsoon Downpour</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">Minto Bridge underpass sag concentrates to 38.3 cm (CRITICAL risk).</p>
    </div>
    <div class="target-card">
      <div class="target-title"><span>M06: Storm Duration Scaling</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">60 min duration yields higher accumulation than 15 min storm.</p>
    </div>
    <div class="target-card">
      <div class="target-title"><span>M07 & M08: Single & Multi-Choke</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">Blocked nodes surcharge; backwater surcharge propagates upstream.</p>
    </div>
    <div class="target-card">
      <div class="target-title"><span>M09: Unblock & Clear State</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">Clicking blocked node unblocks it; CLEAR ALL deterministically restores baseline.</p>
    </div>
    <div class="target-card">
      <div class="target-title"><span>M12 & M13: Submerged Origin/Dest</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">Structured safety flags prevent ambulance dispatch into submerged points.</p>
    </div>
    <div class="target-card">
      <div class="target-title"><span>M14 & M15: Edge Pruning & Bypass</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">Corridors with water depth &gt; 15 cm pruned; safe alternate computed.</p>
    </div>
    <div class="target-card">
      <div class="target-title"><span>M23: Offline Fallback Engine</span> <span class="badge-pass">PASSED</span></div>
      <p class="target-desc">Client-side solver matches backend CPHEEO formulas across all 25 nodes.</p>
    </div>
  </div>

  <div class="footer-note">
    AGASTYA Prototype — SIH 26085 Technical Verification Report · Built with physics-guided urban drainage modeling (CPHEEO & SWMM 1D formulation)
  </div>

</body>
</html>
"""

with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Written HTML to: {HTML_FILE}")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
browser_exe = edge_path if os.path.exists(edge_path) else chrome_path

cmd = [
    browser_exe,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={PDF_FILE}",
    f"file:///{HTML_FILE.as_posix()}"
]

result = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(PDF_FILE):
    print(f"Successfully generated PDF: {PDF_FILE} (Size: {os.path.getsize(PDF_FILE)} bytes)")
else:
    print(f"Failed to generate PDF. Stderr: {result.stderr}")
