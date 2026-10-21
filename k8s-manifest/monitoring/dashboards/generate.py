#!/usr/bin/env python3
"""Grafana dashboard JSON generate kore (output: ei folder-e *.json)."""
import json, os

DS = {"type": "prometheus", "uid": "prometheus"}
UPDOWN = [{"type": "value", "options": {
    "0": {"text": "DOWN", "color": "red"},
    "1": {"text": "UP", "color": "green"}}}]

def panel(i, title, exprs, kind="timeseries", unit=None, mappings=None, h=8):
    p = {
        "id": i + 1, "title": title, "type": kind, "datasource": DS,
        "gridPos": {"x": (i % 2) * 12, "y": (i // 2) * h, "w": 12, "h": h},
        "targets": [{"refId": chr(65 + n), "expr": e, "legendFormat": l,
                     "datasource": DS} for n, (e, l) in enumerate(exprs)],
        "fieldConfig": {"defaults": {}, "overrides": []},
    }
    if unit:
        p["fieldConfig"]["defaults"]["unit"] = unit
    if mappings:
        p["fieldConfig"]["defaults"]["mappings"] = mappings
        p["fieldConfig"]["defaults"]["thresholds"] = {"mode": "absolute", "steps": [
            {"color": "red", "value": None}, {"color": "green", "value": 1}]}
    if kind == "stat":
        p["options"] = {"colorMode": "background", "graphMode": "none",
                        "reduceOptions": {"calcs": ["lastNotNull"]}}
    return p

def dash(uid, title, panels):
    return {"uid": uid, "title": title, "tags": ["ecommerce"],
            "timezone": "browser", "schemaVersion": 39, "refresh": "30s",
            "time": {"from": "now-1h", "to": "now"}, "panels": panels}

D = {}

D["uptime"] = dash("ecom-uptime", "Ecommerce - Uptime", [
    panel(0, "UI / HTTP services", [("probe_success{job=\"blackbox-http\"}", "{{instance}}")],
          "stat", mappings=UPDOWN, h=8),
    panel(1, "Backend / DB / Queue (TCP)", [("probe_success{job=\"blackbox-tcp\"}", "{{instance}}")],
          "stat", mappings=UPDOWN, h=8),
    panel(2, "HTTP response time", [("probe_duration_seconds{job=\"blackbox-http\"}", "{{instance}}")], unit="s"),
    panel(3, "TCP connect time", [("probe_duration_seconds{job=\"blackbox-tcp\"}", "{{instance}}")], unit="s"),
])

NS = 'namespace="ecom"'
D["pods"] = dash("ecom-pods", "Ecommerce - Kubernetes Pods", [
    panel(0, "Running pods", [(f'sum(kube_pod_status_phase{{{NS},phase="Running"}})', "running")], "stat"),
    panel(1, "Pod restarts", [(f'sum by(pod)(kube_pod_container_status_restarts_total{{{NS}}})', "{{pod}}")], "stat"),
    panel(2, "CPU usage (cores)", [(f'sum by(pod)(rate(container_cpu_usage_seconds_total{{{NS},container!=""}}[5m]))', "{{pod}}")]),
    panel(3, "Memory usage", [(f'sum by(pod)(container_memory_working_set_bytes{{{NS},container!=""}})', "{{pod}}")], unit="bytes"),
    panel(4, "Network receive", [(f'sum by(pod)(rate(container_network_receive_bytes_total{{{NS}}}[5m]))', "{{pod}}")], unit="Bps"),
    panel(5, "Network transmit", [(f'sum by(pod)(rate(container_network_transmit_bytes_total{{{NS}}}[5m]))', "{{pod}}")], unit="Bps"),
])

D["node"] = dash("ecom-node", "Ecommerce - Nodes", [
    panel(0, "CPU usage %", [('100 - avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100', "{{instance}}")], unit="percent"),
    panel(1, "Memory usage %", [('100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)', "{{instance}}")], unit="percent"),
    panel(2, "Disk usage % (/)", [('100 - 100 * node_filesystem_avail_bytes{mountpoint="/",fstype!="tmpfs"} / node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"}', "{{instance}}")], unit="percent"),
    panel(3, "Load average (1m)", [('node_load1', "{{instance}}")]),
    panel(4, "Network receive", [('sum by(instance)(rate(node_network_receive_bytes_total{device!~"lo|veth.*|cni.*|flannel.*"}[5m]))', "{{instance}}")], unit="Bps"),
    panel(5, "Network transmit", [('sum by(instance)(rate(node_network_transmit_bytes_total{device!~"lo|veth.*|cni.*|flannel.*"}[5m]))', "{{instance}}")], unit="Bps"),
])

D["rabbitmq"] = dash("ecom-rabbitmq", "Ecommerce - RabbitMQ", [
    panel(0, "Messages ready", [("sum(rabbitmq_queue_messages_ready)", "ready")]),
    panel(1, "Messages unacked", [("sum(rabbitmq_queue_messages_unacked)", "unacked")]),
    panel(2, "Connections / Channels / Consumers", [
        ("sum(rabbitmq_connections)", "connections"),
        ("sum(rabbitmq_channels)", "channels"),
        ("sum(rabbitmq_consumers)", "consumers")]),
    panel(3, "Queues", [("sum(rabbitmq_queues)", "queues")]),
    panel(4, "Messages received/s", [("sum(rate(rabbitmq_global_messages_received_total[5m]))", "received")]),
    panel(5, "Memory used", [("rabbitmq_process_resident_memory_bytes", "{{pod}}")], unit="bytes"),
])

D["redis"] = dash("ecom-redis", "Ecommerce - Redis", [
    panel(0, "Redis up", [("redis_up", "redis")], "stat", mappings=UPDOWN),
    panel(1, "Connected clients", [("redis_connected_clients", "clients")]),
    panel(2, "Memory used", [("redis_memory_used_bytes", "used")], unit="bytes"),
    panel(3, "Commands/s", [("rate(redis_commands_processed_total[5m])", "cmd/s")]),
    panel(4, "Keys", [("sum(redis_db_keys)", "keys")]),
    panel(5, "Cache hit rate", [("rate(redis_keyspace_hits_total[5m]) / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]))", "hit rate")], unit="percentunit"),
])

D["postgres"] = dash("ecom-postgres", "Ecommerce - PostgreSQL", [
    panel(0, "Postgres up", [("pg_up", "postgres")], "stat", mappings=UPDOWN),
    panel(1, "Active connections", [("sum by(datname)(pg_stat_database_numbackends)", "{{datname}}")]),
    panel(2, "Commits/s", [("sum by(datname)(rate(pg_stat_database_xact_commit[5m]))", "{{datname}}")]),
    panel(3, "Rollbacks/s", [("sum by(datname)(rate(pg_stat_database_xact_rollback[5m]))", "{{datname}}")]),
    panel(4, "Rows fetched/s", [("sum by(datname)(rate(pg_stat_database_tup_fetched[5m]))", "{{datname}}")]),
    panel(5, "Deadlocks", [("sum by(datname)(pg_stat_database_deadlocks)", "{{datname}}")]),
])

out = os.path.dirname(os.path.abspath(__file__))
for name, d in D.items():
    with open(os.path.join(out, f"{name}.json"), "w") as f:
        json.dump(d, f, indent=2)
    print("written", name + ".json")
