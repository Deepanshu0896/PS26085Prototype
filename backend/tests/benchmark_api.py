"""
Empirical Latency Benchmarking Script: Agastya FastAPI Endpoints
================================================================
Executes 30 iterations for each key computational endpoint and records
actual wall-clock latency statistics (mean, median, min, max, p95).
"""

import time
import statistics
import json
import sys
import os

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

ITERATIONS = 30


def benchmark_endpoint(name: str, method: str, url: str, payload: dict = None):
    latencies_ms = []

    # Warmup
    for _ in range(3):
        if method == "POST":
            client.post(url, json=payload)
        else:
            client.get(url)

    # Measurement
    for _ in range(ITERATIONS):
        start = time.perf_counter()
        if method == "POST":
            resp = client.post(url, json=payload)
        else:
            resp = client.get(url)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        assert resp.status_code == 200, f"Failed on {name}: {resp.text}"
        latencies_ms.append(elapsed_ms)

    latencies_ms.sort()
    mean_lat = statistics.mean(latencies_ms)
    median_lat = statistics.median(latencies_ms)
    min_lat = min(latencies_ms)
    max_lat = max(latencies_ms)
    p95_lat = latencies_ms[int(0.95 * len(latencies_ms))]

    return {
        "endpoint": name,
        "method": method,
        "url": url,
        "iterations": ITERATIONS,
        "mean_ms": round(mean_lat, 2),
        "median_ms": round(median_lat, 2),
        "min_ms": round(min_lat, 2),
        "max_ms": round(max_lat, 2),
        "p95_ms": round(p95_lat, 2),
    }


def run_all_benchmarks():
    print("=" * 70)
    print("AGASTYA — Real Empirical API Latency Benchmarks")
    print(f"Executing {ITERATIONS} iterations per endpoint...")
    print("=" * 70)

    benchmarks = [
        (
            "Hydraulic Simulation",
            "POST",
            "/api/simulate",
            {"rain_mm": 50.0, "minutes": 30, "blocked_nodes": []},
        ),
        (
            "Safe Dijkstra Route",
            "POST",
            "/api/route",
            {
                "source": "cp_outer_n",
                "target": "barakhamba_junction",
                "threshold_cm": 15.0,
                "rain_mm": 50.0,
                "minutes": 30,
                "blocked_nodes": [],
            },
        ),
        (
            "Multi-Node Choke Analysis",
            "POST",
            "/api/choke",
            {
                "node_id": "minto_bridge_center",
                "node_ids": ["minto_bridge_center", "ddu_marg_west"],
                "rain_mm": 50.0,
                "minutes": 30,
            },
        ),
        ("PySewer Status", "GET", "/api/pysewer/status", None),
        ("PySewer Pipe Synthesis", "POST", "/api/pysewer/synthesize?design_rain_mm_hr=35.0", None),
        ("Drainage Network Topology", "GET", "/api/network", None),
    ]

    results = []
    for name, method, url, payload in benchmarks:
        res = benchmark_endpoint(name, method, url, payload)
        results.append(res)
        print(f"• {res['endpoint']:<28} | Mean: {res['mean_ms']:>6.2f} ms | Median: {res['median_ms']:>6.2f} ms | P95: {res['p95_ms']:>6.2f} ms")

    print("=" * 70)

    # Save results to scratch/benchmark_results.json
    out_path = os.path.join(os.path.dirname(__file__), "benchmark_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Benchmark results saved to: {out_path}")
    return results


if __name__ == "__main__":
    run_all_benchmarks()
