# AGASTYA — Regression Audit & System Verification Report
**SIH Problem Statement 26085: Physics-Guided Urban Flood Nowcasting & Emergency Routing for Minto Bridge Catchment, New Delhi**

---

## Executive Summary

A comprehensive regression audit and overhaul was conducted across the full data pipeline of **AGASTYA**:
$$\text{Simulation Input} \longrightarrow \text{Hydrologic Engine} \longrightarrow \text{API Layer} \longrightarrow \text{State Store} \longrightarrow \text{Map Rendering} \longrightarrow \text{Routing Subgraph} \longrightarrow \text{Offline Fallback}$$

All 12 observed failure cases and regression bugs have been remediated, verified with **44/44 passing automated unit and integration tests**, compiled through **Vite production builds**, and verified in a **live browser session**.

---

## 1. Regression Root Causes & Exact Remediations

| Issue # | Observed Failure | Root Cause Analysis | Technical Fix Implemented | Verification Status |
|---|---|---|---|---|
| **1 & 2** | Only ~6 to 8 nodes updated with flood depths; 19 nodes remained at 0.0 cm even under 75 mm/hr rain. | In [`surcharge.py`](backend/engine/surcharge.py), `inlet_cap` was hardcoded to `0.04 * catch_area / 1000`. Mathematically, $0.04\text{ m}^3/\text{s}$ per $1000\text{ m}^2 = 144\text{ mm/hr}$! Drains were unrealistically modeled as swallowing a 144 mm/hr cloudburst without any surface runoff, so all sloping street nodes produced `excess = 0.0`. | Calibrated intake capacity to Delhi CPHEEO standards ($\sim 18\text{ mm/hr}$ design conveyance). When rainfall exceeds design capacity, all 25 street nodes experience street gutter accumulation ($1.5 - 3.5\text{ cm}$ sheet flow), while the Minto Underpass depression sag concentrates runoff to **$38.3\text{ cm}$ (CRITICAL)**. Zero rainfall produces strictly $0.0\text{ cm}$ across all 25 nodes. | **FIXED & VERIFIED** (All 25 nodes receive positive depths under rain; all 0.0 cm at dry) |
| **3** | M2 (25-node runtime topology) partially failed. | Schema was missing alias fields (`id`, `lng`, `depth`, `risk`, `blocked`, `role`), causing partial serialization dropouts. | Updated [`schemas.py`](backend/schemas.py) and [`api.ts`](frontend/src/lib/api.ts) with full attributes on every node: `id`, `node_id`, `lat`, `lon`, `lng`, `depth_cm`, `depth`, `risk_level`, `risk`, `blocked`, and `role`. | **FIXED & VERIFIED** (`len(nodes) == 25`, invariant holds) |
| **4 & 9** | Multi-node choke and UNBLOCK state machine failed. | Single-string choke parameter without immutable state handling. | Replaced with explicit `blocked_nodes: list[str]` in backend and `Set<string>` in frontend. Clicking a blocked node in choke mode toggles it to **UNBLOCK**; clicking an unblocked node sets it to **BLOCK**. Master graph is cloned and never mutated. | **FIXED & VERIFIED** (Tested single, multi-node, unblock, and graph immutability) |
| **5** | M9 (Reset / clear all chokes) failed. | No deterministic rollback function existed. | Implemented `CLEAR ALL CHOKES` button and API pipeline restoring `blocked_nodes = []`. Verified deterministic equality: $\text{Baseline} \equiv \text{After Choke} \to \text{Clear}$. | **FIXED & VERIFIED** (`test_clear_all_chokes_restores_baseline` PASSED) |
| **6 & 10** | Origin & Destination endpoints could be choked. | Click handler lacked endpoint boundary guards. | In [`FloodMap.tsx`](frontend/src/components/FloodMap.tsx) and [`App.tsx`](frontend/src/App.tsx), clicking origin or destination in choke mode is strictly prohibited with visual tooltip `🛡️ Routing endpoint — cannot be blocked in choke mode.` | **FIXED & VERIFIED** (Guarded with visual badge) |
| **7** | M12 / M13 (Unsafe origin & destination routing) failed. | Dijkstra returned generic failure without structured reasons or specific UI warnings. | In [`safe_route.py`](backend/routing/safe_route.py) and [`networkData.ts`](frontend/src/lib/networkData.ts), structured reasons `ORIGIN_UNSAFE` and `DESTINATION_UNSAFE` are returned when water depth $>15\text{ cm}$. AlertPanel displays explicit warning: `🔴 Origin Unsafe — Deployment Infeasible` or `🔴 Destination Unsafe — Facility Inaccessible`. | **FIXED & VERIFIED** (`test_submerged_origin` and `test_submerged_destination` PASSED) |
| **8 & 11** | Destination marker was red, confusing judges with CRITICAL flood risk. | `CircleMarker` for destination used `#ef4444` (the identical hex color as CRITICAL flood depth). | Changed Destination marker to **Royal Indigo / Blue (`#6366f1`)** with a distinct target ring and icon. START marker is **Emerald Green (`#10b981`)**. Flood markers remain cyan/amber/orange/red. | **FIXED & VERIFIED** (Visual conflict eliminated) |
| **12** | Safe-route edge cases and stale routes. | Edge segments were not pruned if nodes were passable; route did not auto-invalidate when rain rate changed. | Added edge-level clearance check: $\max(\text{depth}[u], \text{depth}[v]) > 15\text{ cm} \implies \text{prune edge } (u, v)$. Route auto-recalculates and clears stale polylines whenever rain, duration, or choke changes. | **FIXED & VERIFIED** (`test_flooded_edge_pruned` and `test_route_invalidated` PASSED) |
| **8** | M23 (Offline mode fallback) used inconsistent equations. | `simulateLocal` and `findRouteLocal` in [`networkData.ts`](frontend/src/lib/networkData.ts) had old thresholds and lacked edge pruning. | Synchronized client-side solver with exact backend CPHEEO formulas, edge pruning, and structured route responses across all 25 nodes. | **FIXED & VERIFIED** (Offline mode utilizes full 25 nodes and 39 links) |
| **13** | No clean "Reset Simulation" without reloading page. | State was scattered across components. | Added `↺ RESET SIMULATION` button restoring rain to 35 mm/hr, duration to 30 min, clearing all chokes, and resetting routing state. | **FIXED & VERIFIED** (Clean in-memory reset) |

---

## 2. Automated Test Suite (44 / 44 Passing)

The test suite in [`backend/tests/`](backend/tests/) was expanded from 24 to **44 comprehensive automated tests**:

```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0
collected 44 items

tests/test_api.py::test_health_endpoint PASSED                           [  2%]
tests/test_api.py::test_network_endpoint PASSED                          [  4%]
tests/test_api.py::test_simulate_endpoint PASSED                         [  6%]
tests/test_api.py::test_simulate_zero_rain PASSED                        [  9%]
tests/test_api.py::test_route_endpoint PASSED                            [ 11%]
tests/test_api.py::test_choke_endpoint PASSED                            [ 13%]
tests/test_api.py::test_pysewer_endpoints PASSED                         [ 15%]
tests/test_api.py::test_rain_live_endpoint PASSED                        [ 18%]
tests/test_hydraulics.py::test_zero_rain_zero_depth PASSED               [ 20%]
tests/test_hydraulics.py::test_pipe_capacity_positive PASSED             [ 22%]
tests/test_hydraulics.py::test_heavy_rain_higher_depth PASSED            [ 25%]
tests/test_hydraulics.py::test_duration_scaling_accumulation PASSED      [ 27%]
tests/test_hydraulics.py::test_single_node_choke_impact PASSED           [ 29%]
tests/test_hydraulics.py::test_multi_node_choke_accumulation PASSED      [ 31%]
tests/test_hydraulics.py::test_minto_underpass_sag_concentration PASSED  [ 34%]
tests/test_hydraulics.py::test_risk_classification PASSED                [ 36%]
tests/test_pysewer.py::test_pysewer_status_metadata PASSED               [ 38%]
tests/test_pysewer.py::test_pysewer_synthesize_topology PASSED           [ 40%]
tests/test_pysewer.py::test_real_elevation_differences_affect_slopes PASSED [ 43%]
tests/test_regressions.py::test_all_25_nodes_receive_simulation_state PASSED [ 45%]
tests/test_regressions.py::test_all_25_nodes_receive_depths PASSED       [ 47%]
tests/test_regressions.py::test_all_25_nodes_receive_risk PASSED         [ 50%]
tests/test_regressions.py::test_node_ids_match_topology PASSED           [ 52%]
tests/test_regressions.py::test_heavy_rain_updates_full_network PASSED   [ 54%]
tests/test_regressions.py::test_zero_rainfall_baseline_is_strictly_zero PASSED [ 56%]
tests/test_regressions.py::test_single_choke PASSED                      [ 59%]
tests/test_regressions.py::test_multi_choke PASSED                       [ 61%]
tests/test_regressions.py::test_unblock_node PASSED                      [ 63%]
tests/test_regressions.py::test_clear_all_chokes PASSED                  [ 65%]
tests/test_regressions.py::test_clear_all_chokes_restores_baseline PASSED [ 68%]
tests/test_regressions.py::test_choke_does_not_mutate_master_graph PASSED [ 70%]
tests/test_regressions.py::test_submerged_origin_returns_unreachable PASSED [ 72%]
tests/test_regressions.py::test_submerged_destination_returns_unreachable PASSED [ 75%]
tests/test_regressions.py::test_origin_equals_destination PASSED         [ 77%]
tests/test_regressions.py::test_invalid_origin PASSED                    [ 79%]
tests/test_regressions.py::test_invalid_destination PASSED               [ 81%]
tests/test_regressions.py::test_flooded_edge_pruned PASSED               [ 84%]
tests/test_regressions.py::test_no_safe_route PASSED                     [ 86%]
tests/test_regressions.py::test_route_invalidated_after_simulation_change PASSED [ 88%]
tests/test_routing.py::test_dry_routing_shortest_path PASSED             [ 90%]
tests/test_routing.py::test_flooded_nodes_avoided PASSED                 [ 93%]
tests/test_routing.py::test_submerged_origin_returns_unreachable PASSED  [ 95%]
tests/test_routing.py::test_submerged_destination_returns_unreachable PASSED [ 97%]
tests/test_routing.py::test_no_viable_path_all_blocked PASSED            [100%]

======================== 44 passed, 1 warning in 3.92s ========================
```

---

## 3. Manual Verification Targets (M01 – M23)

- **M02 (25 Nodes):** PASSED — All 25 nodes render and receive state.
- **M03 (0 mm/hr Dry):** PASSED — All 25 nodes strictly 0.0 cm depth.
- **M04 (35 mm/hr):** PASSED — Valid numeric depths (1.7 cm to 13.3 cm).
- **M05 (75 mm/hr):** PASSED — Minto Sag concentrates to 38.3 cm (CRITICAL).
- **M06 (Duration):** PASSED — 60 min storm yields deeper ponding than 15 min.
- **M07 & M08 (Choke & Multi-Choke):** PASSED — Blocked nodes surcharge, backwater propagates.
- **M09 (Unblock & Clear):** PASSED — Clicking unblocks; `CLEAR ALL CHOKES` deterministically restores baseline.
- **M12 (Submerged Origin):** PASSED — `ORIGIN_UNSAFE` returned, ambulance does not deploy into flood.
- **M13 (Submerged Destination):** PASSED — `DESTINATION_UNSAFE` returned, prompt reroutes to alternative.
- **M14 & M15 (Edge Avoidance & Bypass):** PASSED — Edges with depth $>15\text{ cm}$ pruned; safe alternate computed.
- **M16 (All Unsafe):** PASSED — Returns `NO_SAFE_ROUTE` when corridors are submerged.
- **M23 (Offline Mode):** PASSED — Exact 25-node topology and physical solver used without server.
