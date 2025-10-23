from fastapi import FastAPI, Body, Query, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Tuple, Optional
import socket
import ipaddress
import time
import requests
import datetime
import xml.etree.ElementTree as ET

import json
import re
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
try:
    import paramiko
except Exception:
    paramiko = None
try:
    import winrm
except Exception:
    winrm = None
try:
    from netmiko import ConnectHandler
except Exception:
    ConnectHandler = None
try:
    import psycopg
except Exception:
    psycopg = None

app = FastAPI(title="CMM Analytics API")

Instrumentator().instrument(app).expose(app)

def setup_tracing():
    resource = Resource(attributes={SERVICE_NAME: "cmm-analytics-api"})
    provider = TracerProvider(resource=resource)
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://tempo:4318/v1/traces"))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

setup_tracing()

# Enable CORS for local preview and typical dev hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4173",
        "http://localhost:4174",
        "http://localhost:4175",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/analytics/performance")
def performance():
    return {"summary": {"requests_per_min": 120, "avg_latency_ms": 85}}


# ----------------------
# Discovery Utilities
# ----------------------

COMMON_PORTS: List[int] = [
    22, 80, 443, 8080, 3000, 5000, 5432, 5433, 6379, 27017, 3306,
    5672, 15672, 9090, 9091, 9093, 9094, 9100, 9200, 5601,
    8000, 8022, 2375, 2376, 9323,
    # Virtualização / gestão
    902, 903,            # VMware ESXi/vCenter (VIM/console)
    9440, 9443, 5480,    # Nutanix Prism (9440) e vCenter/VAMI (9443/5480)
    5985, 5986           # WinRM (Hyper-V/Windows)
]

# Extra portas comuns para varredura mais agressiva
TOP_EXTRA_PORTS: List[int] = [
    21, 23, 25, 53, 110, 143, 993, 995,
    8081, 8082, 8090, 8181, 8443, 8880, 8888,
    9000, 9092, 9201, 9300,
    3001, 4000, 4001, 5001, 7001, 8001,
    # Extras relevantes para virtualização e gestão
    902, 903, 9440, 9443, 5480, 5985, 5986
]

SERVICE_MAP = {
    22: "ssh",
    80: "http",
    443: "https",
    8080: "http-alt",
    3000: "grafana-or-app",
    5000: "app-or-registry",
    5432: "postgresql",
    5433: "postgresql",
    6379: "redis",
    27017: "mongodb",
    3306: "mysql",
    5672: "rabbitmq",
    15672: "rabbitmq-admin",
    9090: "prometheus",
    9091: "prometheus-pushgateway",
    9093: "alertmanager",
    9094: "alertmanager-alt",
    9100: "node-exporter",
    9200: "elasticsearch",
    5601: "kibana",
    8000: "app",
    8022: "ssh-alt",
    2375: "docker-api",
    2376: "docker-api-tls",
    9323: "docker-engine-metrics",
    # Virtualização / gestão
    902: "vmware-vim",
    903: "vmware-console",
    9440: "nutanix-prism",
    9443: "vcenter-client",
    5480: "vcenter-vami",
    5985: "winrm",
    5986: "winrm-ssl",
}


# ----------------------
# PostgreSQL Persistence
# ----------------------


PG_HOST = os.environ.get("POSTGRES_HOST", "postgresql")
PG_PORT = int(os.environ.get("POSTGRES_PORT", "5432"))
PG_USER = os.environ.get("POSTGRES_USER", "admin")
PG_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "admin")
PG_DB = os.environ.get("POSTGRES_DB", "AUTOMACAO")

# Rate limiting configuration
RATE_LIMIT_SNMP_SET = int(os.environ.get("RATE_LIMIT_SNMP_SET", "10"))  # requests per minute
RATE_LIMIT_NETMIKO_CMD = int(os.environ.get("RATE_LIMIT_NETMIKO_CMD", "5"))  # requests per minute
RATE_LIMITS = {}  # {ip: {action: [timestamps]}}

def rate_limit_check(client_ip: str, action: str, limit: int) -> bool:
    """Check if client IP is within rate limit for specific action"""
    now = time.time()
    minute_ago = now - 60
    
    if client_ip not in RATE_LIMITS:
        RATE_LIMITS[client_ip] = {}
    
    if action not in RATE_LIMITS[client_ip]:
        RATE_LIMITS[client_ip][action] = []
    
    # Clean old timestamps
    RATE_LIMITS[client_ip][action] = [
        ts for ts in RATE_LIMITS[client_ip][action] if ts > minute_ago
    ]
    
    # Check limit
    if len(RATE_LIMITS[client_ip][action]) >= limit:
        return False
    
    # Add current timestamp
    RATE_LIMITS[client_ip][action].append(now)
    return True

def mask_secrets(data: Dict[str, Any]) -> Dict[str, Any]:
    """Mask sensitive information in dictionaries"""
    if not isinstance(data, dict):
        return data
    
    masked = {}
    sensitive_keys = {
        'password', 'passwd', 'pass', 'secret', 'key', 'token', 
        'auth', 'credential', 'private', 'priv', 'community'
    }
    
    for k, v in data.items():
        key_lower = k.lower()
        if any(sensitive in key_lower for sensitive in sensitive_keys):
            if isinstance(v, str) and len(v) > 0:
                masked[k] = f"{v[:2]}***{v[-1:]}" if len(v) > 3 else "***"
            else:
                masked[k] = "***"
        elif isinstance(v, dict):
            masked[k] = mask_secrets(v)
        else:
            masked[k] = v
    
    return masked

def validate_snmp_v3(v3_data: Dict[str, Any]) -> List[str]:
    """Validate SNMPv3 authentication and privacy combinations"""
    errors = []
    
    if not v3_data:
        return errors
    
    auth_protocol = v3_data.get('authProtocol', 'none')
    priv_protocol = v3_data.get('privProtocol', 'none')
    auth_password = v3_data.get('authPassword', '')
    priv_password = v3_data.get('privPassword', '')
    
    # Authentication validation
    if auth_protocol != 'none':
        if not auth_password:
            errors.append("Authentication password required when auth protocol is specified")
        elif len(auth_password) < 8:
            errors.append("Authentication password must be at least 8 characters")
    
    # Privacy validation
    if priv_protocol != 'none':
        if auth_protocol == 'none':
            errors.append("Authentication must be enabled to use privacy")
        if not priv_password:
            errors.append("Privacy password required when privacy protocol is specified")
        elif len(priv_password) < 8:
            errors.append("Privacy password must be at least 8 characters")
    
    return errors

def measure_tcp_latency(host: str, port: int, timeout: float = 2.0) -> Optional[float]:
    """Measure TCP connection latency to a host:port"""
    try:
        start_time = time.time()
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        end_time = time.time()
        sock.close()
        
        if result == 0:
            return (end_time - start_time) * 1000  # Convert to milliseconds
        return None
    except Exception:
        return None

def get_pg_conn():
    if not psycopg:
        return None
    try:
        return psycopg.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD, dbname=PG_DB, autocommit=True)
    except Exception:
        return None

def ensure_pg_extensions():
    conn = get_pg_conn()
    if not conn:
        return False
    try:
        with conn.cursor() as cur:
            cur.execute('CREATE EXTENSION IF NOT EXISTS pg_stat_statements;')
            cur.execute('CREATE EXTENSION IF NOT EXISTS pg_wait_sampling;')
        return True
    except Exception:
        return False

@app.on_event("startup")
def _startup_init():
    ensure_pg_extensions()
    ensure_pg_schema()

def ensure_pg_schema():
    conn = get_pg_conn()
    if not conn:
        return False
    try:
        with conn.cursor() as cur:
            cur.execute('CREATE SCHEMA IF NOT EXISTS "AUTOMACAO";')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS "AUTOMACAO"."Devices" (
                    id SERIAL PRIMARY KEY,
                    ip VARCHAR(64) UNIQUE,
                    hostname VARCHAR(255) UNIQUE,
                    os VARCHAR(64),
                    status VARCHAR(32) DEFAULT 'Unknown',
                    services JSONB DEFAULT '[]'::jsonb,
                    last_seen TIMESTAMPTZ,
                    node_exporter JSONB DEFAULT '{}'::jsonb,
                    virtualization VARCHAR(64),
                    real BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS "AUTOMACAO"."DeviceInterfaces" (
                    id SERIAL PRIMARY KEY,
                    device_id INTEGER REFERENCES "AUTOMACAO"."Devices"(id) ON DELETE CASCADE,
                    name VARCHAR(128),
                    mac VARCHAR(64),
                    ipv4 VARCHAR(64),
                    ipv6 VARCHAR(64),
                    speed_mbps INTEGER,
                    status VARCHAR(32),
                    type VARCHAR(64),
                    last_seen TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(device_id, name)
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS "AUTOMACAO"."NetworkLinks" (
                    id SERIAL PRIMARY KEY,
                    src_device_id INTEGER REFERENCES "AUTOMACAO"."Devices"(id) ON DELETE CASCADE,
                    src_interface_id INTEGER REFERENCES "AUTOMACAO"."DeviceInterfaces"(id) ON DELETE SET NULL,
                    dst_device_id INTEGER REFERENCES "AUTOMACAO"."Devices"(id) ON DELETE CASCADE,
                    dst_interface_id INTEGER REFERENCES "AUTOMACAO"."DeviceInterfaces"(id) ON DELETE SET NULL,
                    link_type VARCHAR(64),
                    latency_ms DOUBLE PRECISION,
                    bandwidth_mbps INTEGER,
                    status VARCHAR(32),
                    discovered_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(src_device_id, dst_device_id, link_type)
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS "AUTOMACAO"."Metrics" (
                    id BIGSERIAL PRIMARY KEY,
                    device_id INTEGER REFERENCES "AUTOMACAO"."Devices"(id) ON DELETE CASCADE,
                    metric_name VARCHAR(128) NOT NULL,
                    metric_labels JSONB DEFAULT '{}'::jsonb,
                    value DOUBLE PRECISION NOT NULL,
                    ts TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(device_id, metric_name, ts)
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS "AUTOMACAO"."Events" (
                    id BIGSERIAL PRIMARY KEY,
                    device_id INTEGER REFERENCES "AUTOMACAO"."Devices"(id) ON DELETE CASCADE,
                    event_type VARCHAR(128) NOT NULL,
                    severity VARCHAR(32) DEFAULT 'info',
                    description TEXT,
                    attributes JSONB DEFAULT '{}'::jsonb,
                    actor VARCHAR(128),
                    source VARCHAR(64),
                    ts TIMESTAMPTZ DEFAULT NOW()
                )
            ''')
            cur.execute('ALTER TABLE IF NOT EXISTS "AUTOMACAO"."Events" ADD COLUMN IF NOT EXISTS actor VARCHAR(128);')
            cur.execute('ALTER TABLE IF NOT EXISTS "AUTOMACAO"."Events" ADD COLUMN IF NOT EXISTS source VARCHAR(64);')
        conn.close()
        return True
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return False





def record_discovery_host(ip: str, hostname: str, os: str, status: str, services: List[Tuple[str,int]]):
    """Persist discovery results using PostgreSQL Devices upsert (PG-only)."""
    ensure_pg_schema()
    payload: Dict[str, Any] = {
        "ip": ip,
        "hostname": hostname,
        "os": os or "Unknown",
        "status": status or "Unknown",
        "services": [{"service": svc, "port": port} for svc, port in services],
        "lastSeen": time.strftime("%Y-%m-%d %H:%M:%S"),
        "real": True,
    }
    try:
        pg_upsert_device(payload)
    except Exception:
        # PG-only refactor: no SQLite/JSON fallback
        pass

def record_metric(ip: str, metric: str, value: float, ts: int | None = None):
    """Record a metric in PostgreSQL Metrics table (PG-only)."""
    ensure_pg_schema()
    device = pg_get_device(ip=ip)
    if not device:
        try:
            pg_upsert_device({
                "ip": ip,
                "hostname": ip,
                "status": "Unknown",
                "os": "Unknown",
                "services": [],
                "lastSeen": time.strftime("%Y-%m-%d %H:%M:%S"),
                "real": True,
            })
            device = pg_get_device(ip=ip)
        except Exception:
            device = None
    if not device:
        return
    conn = get_pg_conn()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO "AUTOMACAO"."Metrics" (device_id, metric_name, metric_labels, value, ts)
                VALUES (%s, %s, %s::jsonb, %s, to_timestamp(%s))
            ''', (device["id"], metric, json.dumps({}), float(value), int(ts or time.time())))
    except Exception:
        pass
    finally:
        try:
            conn.close()
        except Exception:
            pass

def get_series(ip: str, metric: str, limit: int = 60) -> List[Dict[str, Any]]:
    ensure_pg_schema()
    conn = get_pg_conn()
    if not conn:
        return []
    try:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT m.value, EXTRACT(EPOCH FROM m.ts)::bigint AS ts_epoch
                FROM "AUTOMACAO"."Metrics" m
                JOIN "AUTOMACAO"."Devices" d ON m.device_id = d.id
                WHERE d.ip = %s AND m.metric_name = %s
                ORDER BY m.ts DESC
                LIMIT %s
            ''', (ip, metric, limit))
            rows = cur.fetchall()
    except Exception:
        rows = []
    finally:
        try:
            conn.close()
        except Exception:
            pass
    # return in ascending time order
    rows = list(reversed(rows))
    return [{"time": time.strftime("%H:%M:%S", time.localtime(int(row[1]))), "value": float(row[0])} for row in rows]


def tcp_check(ip: str, port: int, timeout: float = 0.35) -> bool:
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except Exception:
        return False


def reverse_dns(ip: str) -> str:
    try:
        return socket.gethostbyaddr(ip)[0]
    except Exception:
        return ip


def scan_ports(ip: str, ports: List[int]) -> Dict[int, bool]:
    results: Dict[int, bool] = {}
    with ThreadPoolExecutor(max_workers=64) as executor:
        future_map = {executor.submit(tcp_check, ip, p): p for p in ports}
        for fut in as_completed(future_map):
            port = future_map[fut]
            try:
                results[port] = fut.result()
            except Exception:
                results[port] = False
    return results


def probe_node_exporter(ip: str, timeout: float = 0.8) -> Dict[str, Any]:
    url = f"http://{ip}:9100/metrics"
    info: Dict[str, Any] = {"present": False}
    try:
        resp = requests.get(url, timeout=timeout)
        if resp.status_code == 200 and "node_" in resp.text:
            info["present"] = True
            lines = [ln for ln in resp.text.splitlines() if ln and not ln.startswith('#')]

            def parse_simple_value(name: str) -> float | None:
                for ln in lines:
                    if ln.startswith(name + ' '):
                        try:
                            return float(ln.split()[-1])
                        except Exception:
                            return None
                return None

            # Memory
            mem_total = parse_simple_value("node_memory_MemTotal_bytes")
            mem_available = parse_simple_value("node_memory_MemAvailable_bytes")
            info["mem_total_bytes"] = mem_total
            info["mem_available_bytes"] = mem_available
            mem_used_pct = None
            if mem_total and mem_available and mem_total > 0:
                mem_used_pct = (mem_total - mem_available) / mem_total * 100.0
                info["mem_used_percent"] = mem_used_pct

            # CPU cumulative
            idle_sum = 0.0
            total_sum = 0.0
            for ln in lines:
                if ln.startswith("node_cpu_seconds_total{"):
                    try:
                        # example: node_cpu_seconds_total{cpu="0",mode="idle"} 12345.678
                        parts = ln.split('}')
                        val = float(parts[-1].strip())
                        total_sum += val
                        if 'mode="idle"' in ln:
                            idle_sum += val
                    except Exception:
                        pass
            info["cpu_idle_cum"] = idle_sum
            info["cpu_total_cum"] = total_sum

            # Network cumulative
            rx_sum = 0.0
            tx_sum = 0.0
            for ln in lines:
                if ln.startswith("node_network_receive_bytes_total{"):
                    try:
                        if 'device="lo"' in ln:
                            continue
                        val = float(ln.split('}')[-1].strip())
                        rx_sum += val
                    except Exception:
                        pass
                elif ln.startswith("node_network_transmit_bytes_total{"):
                    try:
                        if 'device="lo"' in ln:
                            continue
                        val = float(ln.split('}')[-1].strip())
                        tx_sum += val
                    except Exception:
                        pass
            info["net_rx_cum"] = rx_sum
            info["net_tx_cum"] = tx_sum

            # Filesystem usage (aggregate)
            size_sum = 0.0
            avail_sum = 0.0
            for ln in lines:
                if ln.startswith("node_filesystem_size_bytes{"):
                    try:
                        if 'fstype="tmpfs"' in ln or 'fstype="aufs"' in ln:
                            continue
                        val = float(ln.split('}')[-1].strip())
                        size_sum += val
                    except Exception:
                        pass
                elif ln.startswith("node_filesystem_avail_bytes{"):
                    try:
                        if 'fstype="tmpfs"' in ln or 'fstype="aufs"' in ln:
                            continue
                        val = float(ln.split('}')[-1].strip())
                        avail_sum += val
                    except Exception:
                        pass
            info["fs_size_sum"] = size_sum
            info["fs_avail_sum"] = avail_sum
            fs_used_pct = None
            if size_sum and avail_sum and size_sum > 0:
                fs_used_pct = (size_sum - avail_sum) / size_sum * 100.0
                info["fs_used_percent"] = fs_used_pct

            # os/hw hints
            uname_line = next((ln for ln in lines if ln.startswith("node_uname_info")), None)
            if uname_line:
                info["uname"] = uname_line
    except Exception:
        pass
    return info


def probe_docker(ip: str, timeout: float = 1.5) -> Dict[str, Any]:
    result: Dict[str, Any] = {"present": False}
    bases = [
        (f"http://{ip}:2375", False),
        (f"https://{ip}:2376", True),
    ]
    for base, is_https in bases:
        try:
            v = requests.get(base + "/version", timeout=timeout, verify=False if is_https else True)
            if v.status_code == 200:
                result["present"] = True
                result["version"] = v.json()
                info = requests.get(base + "/info", timeout=timeout, verify=False if is_https else True)
                if info.status_code == 200:
                    result["info"] = info.json()
                containers = requests.get(base + "/containers/json?all=0", timeout=timeout, verify=False if is_https else True)
                if containers.status_code == 200:
                    conts = containers.json()
                    result["containers"] = []
                    for c in conts:
                        cid = c.get("Id")
                        name = (c.get("Names") or [None])[0]
                        logs = None
                        try:
                            lg = requests.get(base + f"/containers/{cid}/logs?stdout=1&stderr=1&tail=100", timeout=timeout, verify=False if is_https else True)
                            if lg.status_code == 200:
                                logs = lg.text[-4000:]
                        except Exception:
                            logs = None
                        # Classificar serviços a partir das portas expostas
                        svc_tags: List[str] = []
                        try:
                            ports = c.get("Ports")
                            if isinstance(ports, list):
                                for p in ports:
                                    pub = p.get("PublicPort")
                                    priv = p.get("PrivatePort")
                                    num = pub or priv
                                    if isinstance(num, int):
                                        svc = SERVICE_MAP.get(num, f"port-{num}")
                                        svc_tags.append(f"{svc}:{num}")
                        except Exception:
                            pass
                        result["containers"].append({
                            "id": cid,
                            "name": name,
                            "image": c.get("Image"),
                            "state": c.get("State"),
                            "status": c.get("Status"),
                            "ports": c.get("Ports"),
                            "labels": c.get("Labels"),
                            "logs_tail": logs,
                            "services_classified": svc_tags,
                        })
                # Se obtivemos dados via API, não precisa testar outras bases
                break
        except Exception:
            continue
    # Fallback: tentar métricas do Docker Engine
    try:
        m = requests.get(f"http://{ip}:9323/metrics", timeout=timeout)
        if m.status_code == 200 and ("engine_daemon" in m.text or "dockerd" in m.text):
            result["present"] = True
            result["metrics_present"] = True
    except Exception:
        pass
    # Fallback adicional: detectar Portainer em 9443 apenas como dica, sem marcar presença
    try:
        https_probe = probe_https(ip, 9443)
        text = (https_probe.get("text_snippet") or "").lower()
        server = (https_probe.get("server") or "").lower()
        if ("portainer" in text) or ("portainer" in server):
            result["hint_portainer"] = True
    except Exception:
        pass
    return result


def probe_http(ip: str, port: int, timeout: float = 0.8) -> Dict[str, Any]:
    url = f"http://{ip}:{port}/"
    try:
        r = requests.get(url, timeout=timeout)
        return {
            "reachable": True,
            "status_code": r.status_code,
            "server": r.headers.get("Server"),
        }
    except Exception as e:
        return {"reachable": False, "error": str(e)}


def probe_https(ip: str, port: int, timeout: float = 0.8) -> Dict[str, Any]:
    url = f"https://{ip}:{port}/"
    try:
        r = requests.get(url, timeout=timeout, verify=False)
        # Captura breve do conteúdo para heurísticas (ex.: Portainer)
        text_snippet: str | None = None
        try:
            # Limita para evitar overhead
            text_snippet = r.text[:256]
        except Exception:
            text_snippet = None
        return {
            "reachable": True,
            "status_code": r.status_code,
            "server": r.headers.get("Server"),
            "text_snippet": text_snippet,
        }
    except Exception as e:
        return {"reachable": False, "error": str(e)}


# ----------------------
# SSH helpers (Linux-only enrichment)
# ----------------------

def ssh_run_command(ip: str, user: str, password: Optional[str] = None, key_path: Optional[str] = None,
                    port: int = 22, timeout: float = 2.5) -> Tuple[bool, str | None, str | None]:
    """Run a remote command via SSH. Returns (ok, stdout, stderr)."""
    if not paramiko:
        return (False, None, "Paramiko not available")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        if key_path:
            try:
                pkey = paramiko.RSAKey.from_private_key_file(key_path)
            except Exception:
                pkey = None
        else:
            pkey = None
        ssh.connect(ip, port=port, username=user, password=password, pkey=pkey, timeout=timeout)
        # We'll not execute here; caller will call .exec_command via wrapper below
        return (True, None, None)
    except Exception as e:
        return (False, None, str(e))

def ssh_exec(ip: str, user: str, cmd: str, password: Optional[str] = None, key_path: Optional[str] = None,
             port: int = 22, timeout: float = 3.0) -> Tuple[bool, str | None, str | None]:
    if not paramiko:
        return (False, None, "Paramiko not available")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        pkey = None
        if key_path:
            try:
                pkey = paramiko.RSAKey.from_private_key_file(key_path)
            except Exception:
                pkey = None
        ssh.connect(ip, port=port, username=user, password=password, pkey=pkey, timeout=timeout)
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode(errors="ignore")
        err = stderr.read().decode(errors="ignore")
        ssh.close()
        return (True, out, err)
    except Exception as e:
        return (False, None, str(e))

def parse_ss_tulnp_output(text: str) -> List[Dict[str, Any]]:
    """Parse 'ss -tulnp' output into entries: protocol, state, addr, port, process."""
    entries: List[Dict[str, Any]] = []
    if not text:
        return entries
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    # Skip header line (starts with Netid)
    for ln in lines:
        if ln.lower().startswith("netid"):
            continue
        # Split into tokens; last tokens include users:("proc",pid=...,fd=...)
        # We'll try to capture protocol, state, local address:port, process name
        parts = re.split(r"\s+", ln)
        if len(parts) < 5:
            continue
        proto = parts[0]
        state = parts[1]
        # Find something that looks like address:port (contains a colon)
        addr_port = next((p for p in parts if ":" in p and not p.endswith(":") and not p.startswith("users:(")), None)
        port = None
        addr = None
        if addr_port:
            # IPv6 may have many colons — split from right
            if ":" in addr_port:
                addr, _, port = addr_port.rpartition(":")
        # Extract process info
        # Capture first process name from ss 'users:("proc",pid=...)' format
        m = re.search(r'users:\(\("([^\"]+)"', ln)
        proc = None
        if m:
            proc = m.group(1)
        entries.append({
            "proto": proto,
            "state": state,
            "addr": addr,
            "port": int(port) if port and port.isdigit() else port,
            "process": proc,
            "raw": ln,
        })
    return entries

def map_service_from_process_or_port(proc: Optional[str], port: Optional[int]) -> str:
    proc_l = (proc or "").lower()
    if proc_l:
        if "nginx" in proc_l:
            return "http"
        if "apache" in proc_l or "httpd" in proc_l:
            return "http"
        if "postgres" in proc_l:
            return "postgresql"
        if "mysqld" in proc_l:
            return "mysql"
        if "redis" in proc_l:
            return "redis"
        if "mongod" in proc_l:
            return "mongodb"
        if "dockerd" in proc_l:
            return "docker-engine"
        if "docker-proxy" in proc_l:
            return "container-port"
        if "sshd" in proc_l:
            return "ssh"
        if "w3wp" in proc_l:
            return "iis"
        if "sqlservr" in proc_l:
            return "mssql"
        if "winrm" in proc_l:
            return "winrm"
    # fallback by port
    if isinstance(port, int):
        return SERVICE_MAP.get(port, f"port-{port}")
    return "unknown"


def probe_ssh_banner(ip: str, port: int = 22, timeout: float = 0.8) -> Dict[str, Any]:
    try:
        with socket.create_connection((ip, port), timeout=timeout) as s:
            s.settimeout(timeout)
            banner = s.recv(128)
            return {
                "reachable": True,
                "banner": banner.decode(errors="ignore").strip(),
            }
    except Exception as e:
        return {"reachable": False, "error": str(e)}


def guess_os_from_ports(open_ports: List[int]) -> str | None:
    # Heurística refinada:
    # - WinRM (5985/5986) indica fortemente Windows
    # - 135 (DCE/RPC) sugere Windows, mas não conclua se SSH (22) também estiver aberto
    # - 445 pode ser Samba em Linux, então NÃO use como sinal de Windows
    if 5985 in open_ports or 5986 in open_ports:
        return "Windows (heuristic)"
    if 135 in open_ports and 22 not in open_ports:
        return "Windows (heuristic)"
    if 22 in open_ports:
        return "Linux/Unix (heuristic)"
    return None


def guess_virtualization_from_ports(open_ports: List[int]) -> str | None:
    """Heurística simples para identificar plataforma de virtualização.
    Evita concluir VMware apenas por 9443 isolada (pode ser Portainer).
    """
    if 9440 in open_ports:
        return "Nutanix Prism/AHV (heurístico)"
    # Para VMware, exija 902 (ESXi) OU 5480 (VAMI) OU 9443 acompanhada de 902/5480
    if (902 in open_ports) or (5480 in open_ports) or (9443 in open_ports and (902 in open_ports or 5480 in open_ports)):
        return "VMware ESXi/vCenter (heurístico)"
    if 5985 in open_ports or 5986 in open_ports:
        return "Microsoft Hyper-V/Windows (heurístico)"
    return None


def discover_host(ip: str) -> Dict[str, Any]:
    rdns = reverse_dns(ip)
    ports_scan = scan_ports(ip, COMMON_PORTS)
    open_ports = [p for p, ok in ports_scan.items() if ok]
    # Refina nomes de serviços (especialmente 9443 -> Portainer)
    services: List[str] = []
    for p in open_ports:
        name = SERVICE_MAP.get(p, f"port-{p}")
        if p in (443, 9443, 9440, 5480):
            res = probe_https(ip, p)
            text = (res.get("text_snippet") or "").lower()
            server = (res.get("server") or "").lower()
            if p == 9443 and (("portainer" in text) or ("portainer" in server) or (8000 in open_ports)):
                name = "portainer"
        services.append(name)
    node = probe_node_exporter(ip)
    docker = probe_docker(ip)
    os_guess = guess_os_from_ports(open_ports) or (node.get("uname") if node.get("present") else None)
    virt_guess = guess_virtualization_from_ports(open_ports)
    os_label = os_guess or "Unknown"
    status = "Online" if open_ports else "Offline"
    # persist discovery
    record_discovery_host(ip, rdns, os_label, status, list(zip(services, open_ports)))
    return {
        "ip": ip,
        "hostname": rdns,
        "status": status,
        "open_ports": open_ports,
        "services": services,
        # Serviços com verificação ativa (HTTP/HTTPS/SSH/Docker/NodeExporter)
        "services_detailed": [],
        "os": os_label,
        "virtualization": virt_guess,
        "node_exporter": node,
        "docker": docker,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


def get_ports_for_method(method: str) -> List[int]:
    """Retorna lista de portas para varredura conforme método informado."""
    m = (method or "tcp").lower()
    if m in ("nmap", "aggressive"):
        # Varredura mais ampla: 1-1023 + blocos populares + portas comuns
        expanded = set(COMMON_PORTS)
        expanded.update(TOP_EXTRA_PORTS)
        expanded.update(range(1, 1024))
        expanded.update(range(3000, 3101))
        expanded.update(range(8000, 8101))
        return sorted(expanded)
    return COMMON_PORTS


def discover_host_with_ports(ip: str, ports: List[int]) -> Dict[str, Any]:
    rdns = reverse_dns(ip)
    ports_scan = scan_ports(ip, ports)
    open_ports = [p for p, ok in ports_scan.items() if ok]
    services = [SERVICE_MAP.get(p, f"port-{p}") for p in open_ports]
    node = probe_node_exporter(ip)
    docker = probe_docker(ip)
    os_guess = guess_os_from_ports(open_ports) or (node.get("uname") if node.get("present") else None)
    virt_guess = guess_virtualization_from_ports(open_ports)
    os_label = os_guess or "Unknown"
    status = "Online" if open_ports else "Offline"
    # Build detailed services list with lightweight verification
    services_detailed: List[Dict[str, Any]] = []
    updated_services: List[str] = []
    for p in open_ports:
        name = SERVICE_MAP.get(p, f"port-{p}")
        det: Dict[str, Any] = {"service": name, "port": p, "verified": False}
        if p == 22:
            res = probe_ssh_banner(ip, 22)
            det.update({"verified": res.get("reachable", False), "detail": res.get("banner") or res.get("error")})
        elif p in (80, 8080, 3000, 5000):
            res = probe_http(ip, p)
            det.update({"verified": res.get("reachable", False), "detail": res.get("server") or res.get("error")})
        elif p in (443, 9443, 9440, 5480):
            res = probe_https(ip, p)
            # Heurística: 9443 pode ser Portainer; ajuste o nome quando detectado
            text = (res.get("text_snippet") or "").lower()
            server = (res.get("server") or "").lower()
            if p == 9443 and (("portainer" in text or "portainer" in server) or (8000 in open_ports)):
                name = "portainer"
                det["service"] = name
            det.update({"verified": res.get("reachable", False), "detail": res.get("server") or res.get("error")})
        elif p in (2375, 2376):
            # probe_docker already ran; mark verified if present
            det.update({"verified": docker.get("present", False), "detail": "Docker Engine API" if docker.get("present") else None})
        elif p == 9100:
            det.update({"verified": node.get("present", False), "detail": "Node Exporter" if node.get("present") else None})
        services_detailed.append(det)
        updated_services.append(name)

    # Atualiza serviços com nomes refinados e persiste
    services = updated_services
    record_discovery_host(ip, rdns, os_label, status, list(zip(services, open_ports)))

    return {
        "ip": ip,
        "hostname": rdns,
        "status": status,
        "open_ports": open_ports,
        "services": services,
        "services_detailed": services_detailed,
        "os": os_label,
        "virtualization": virt_guess,
        "node_exporter": node,
        "docker": docker,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


def enrich_linux_details(ip: str, base: Dict[str, Any], ssh_user: Optional[str] = None,
                         ssh_pass: Optional[str] = None, ssh_key: Optional[str] = None,
                         ssh_port: int = 22, ssh_timeout: float = 3.0) -> Dict[str, Any]:
    """If host looks like Linux and SSH creds provided, run 'ss -tulnp' and (optionally) 'docker ps'."""
    os_label = (base.get("os") or "").lower()
    open_ports = base.get("open_ports") or []
    # Only proceed if Linux and SSH port seems open and we have credentials
    if ("linux" in os_label) and (22 in open_ports) and ssh_user and (ssh_pass or ssh_key):
        ok, out, err = ssh_exec(ip, ssh_user, "ss -tulnp", password=ssh_pass, key_path=ssh_key, port=ssh_port, timeout=ssh_timeout)
        if ok and out:
            entries = parse_ss_tulnp_output(out)
            base["linux_ports"] = entries
            # Add into services_detailed
            dets = base.get("services_detailed") or []
            for e in entries:
                svc_name = map_service_from_process_or_port(e.get("process"), e.get("port"))
                dets.append({"service": svc_name, "port": e.get("port"), "verified": True, "detail": e.get("process")})
            base["services_detailed"] = dets
            # Sempre tentar coletar containers via SSH (sem depender de Portainer/heurísticas)
            ok2, out2, err2 = ssh_exec(ip, ssh_user, "docker ps -a --format '{{json .}}'", password=ssh_pass, key_path=ssh_key, port=ssh_port, timeout=ssh_timeout)
            containers: List[Dict[str, Any]] = []
            docker_present_via_ssh = False
            if ok2:
                if (err2 or "") and ("not found" in (err2 or "").lower() or "docker: command not found" in (err2 or "").lower()):
                    docker_present_via_ssh = False
                else:
                    docker_present_via_ssh = True
            if ok2 and out2:
                for ln in out2.splitlines():
                    ln = ln.strip()
                    if not ln:
                        continue
                    try:
                        obj = json.loads(ln)
                    except Exception:
                        obj = None
                    if obj:
                        # Classificar serviços do container a partir da string Ports
                        svc_tags: List[str] = []
                        try:
                            ports_str = obj.get("Ports") or ""
                            for part in re.split(r",\s*", ports_str):
                                m = re.search(r"(?:(\d+)->)?(\d+)/(tcp|udp)?", part)
                                if m:
                                    pub = m.group(1)
                                    priv = m.group(2)
                                    num = int(pub or priv)
                                    svc = SERVICE_MAP.get(num, f"port-{num}")
                                    svc_tags.append(f"{svc}:{num}")
                        except Exception:
                            pass
                        containers.append({
                            "id": obj.get("ID"),
                            "name": obj.get("Names"),
                            "image": obj.get("Image"),
                            "ports": obj.get("Ports"),
                            "status": obj.get("Status"),
                            "services_classified": svc_tags,
                            "running": bool(str(obj.get("Status") or "").lower().startswith("up")),
                        })
            # Merge with existing docker info if present
            docker_info = base.get("docker") or {}
            if docker_present_via_ssh:
                docker_info["present"] = True
                docker_info.setdefault("hint_ssh", True)
            if containers is not None:
                docker_info["containers"] = containers
            base["docker"] = docker_info
    return base

# Docker via SSH (compose + containers)
def probe_docker_via_ssh(ip: str, ssh_user: Optional[str] = None, ssh_pass: Optional[str] = None,
                         ssh_key: Optional[str] = None, ssh_port: int = 22, ssh_timeout: float = 3.0) -> Dict[str, Any]:
    result: Dict[str, Any] = {"present": False}
    if not (ssh_user and (ssh_pass or ssh_key)):
        return result
    # 1) Tentar docker compose ls (como sugerido)
    compose_ok = False
    compose_projects: List[Dict[str, Any]] = []
    for cmd in ["docker compose ls --format json", "docker compose ls", "docker-compose ls --format json", "docker-compose ls"]:
        ok, out, err = ssh_exec(ip, ssh_user, cmd, password=ssh_pass, key_path=ssh_key, port=ssh_port, timeout=ssh_timeout)
        if ok:
            if (err or "") and ("not found" in (err or "").lower() or "command not found" in (err or "").lower() or "unknown" in (err or "").lower()):
                compose_ok = False
                continue
            if out:
                compose_ok = True
                # tentar parse json
                try:
                    data = json.loads(out)
                    if isinstance(data, list):
                        for p in data:
                            compose_projects.append({
                                "name": p.get("Name") or p.get("name") or p.get("project"),
                                "status": p.get("Status") or p.get("status"),
                                "created": p.get("Created") or p.get("created"),
                            })
                    else:
                        # formato texto; apenas guardar snippet
                        compose_projects.append({"raw": out[:512]})
                except Exception:
                    compose_projects.append({"raw": out[:512]})
                break
    # 2) docker ps -a para listar containers e decidir presença
    ok2, out2, err2 = ssh_exec(ip, ssh_user, "docker ps -a --format '{{json .}}'", password=ssh_pass, key_path=ssh_key, port=ssh_port, timeout=ssh_timeout)
    containers: List[Dict[str, Any]] = []
    docker_present_via_ssh = False
    if ok2:
        if (err2 or "") and ("not found" in (err2 or "").lower() or "docker: command not found" in (err2 or "").lower()):
            docker_present_via_ssh = False
        else:
            docker_present_via_ssh = True
    if ok2 and out2:
        for ln in out2.splitlines():
            ln = ln.strip()
            if not ln:
                continue
            try:
                obj = json.loads(ln)
            except Exception:
                obj = None
            if obj:
                svc_tags: List[str] = []
                try:
                    ports_str = obj.get("Ports") or ""
                    for part in re.split(r",\s*", ports_str):
                        m = re.search(r"(?:(\d+)->)?(\d+)/(tcp|udp)?", part)
                        if m:
                            pub = m.group(1)
                            priv = m.group(2)
                            num = int(pub or priv)
                            svc = SERVICE_MAP.get(num, f"port-{num}")
                            svc_tags.append(f"{svc}:{num}")
                except Exception:
                    pass
                # logs por ID (tail 100)
                logs_tail: str | None = None
                cid = obj.get("ID")
                if cid:
                    ok3, out3, err3 = ssh_exec(ip, ssh_user, f"docker logs {cid} --tail 100", password=ssh_pass, key_path=ssh_key, port=ssh_port, timeout=ssh_timeout)
                    if ok3 and out3:
                        logs_tail = out3[-4000:]
                containers.append({
                    "id": cid,
                    "name": obj.get("Names"),
                    "image": obj.get("Image"),
                    "ports": obj.get("Ports"),
                    "status": obj.get("Status"),
                    "services_classified": svc_tags,
                    "running": bool(str(obj.get("Status") or "").lower().startswith("up")),
                    "logs_tail": logs_tail,
                })
    # Decisão de presença:
    # - Se compose falhou (erro), considerar sem Docker conforme sugestão
    # - Caso contrário, se docker ps funcionou, considerar presente
    if compose_ok:
        result["present"] = True
    elif docker_present_via_ssh:
        result["present"] = True
    else:
        result["present"] = False
        result["error"] = "Docker não detectado via SSH (compose/ps)"
    result["compose_projects"] = compose_projects
    result["containers"] = containers
    result["source"] = "ssh"
    return result


def winrm_exec(ip: str, user: str, ps_script: str, password: Optional[str] = None,
               use_tls: bool = False, port: int = 5985, timeout: float = 4.0) -> Tuple[bool, str | None, str | None]:
    """Execute PowerShell script remotely via WinRM. Returns (ok, stdout, stderr)."""
    if not winrm:
        return False, None, "pywinrm not installed"
    endpoint = f"{'https' if use_tls else 'http'}://{ip}:{port}/wsman"
    try:
        session = winrm.Session(endpoint, auth=(user, password))
        r = session.run_ps(ps_script)
        out = (r.std_out or b"").decode(errors="ignore")
        err = (r.std_err or b"").decode(errors="ignore")
        return (r.status_code == 0, out, err)
    except Exception as e:
        return False, None, str(e)


def enrich_windows_details(ip: str, base: Dict[str, Any], winrm_user: Optional[str] = None,
                           winrm_pass: Optional[str] = None, winrm_use_tls: bool = False,
                           winrm_port: int = 5985, winrm_timeout: float = 4.0) -> Dict[str, Any]:
    """If host looks like Windows and WinRM creds provided, collect listening ports and OS info."""
    os_label = (base.get("os") or "").lower()
    open_ports: List[int] = base.get("open_ports") or []
    looks_windows = ("windows" in os_label) or (5985 in open_ports) or (5986 in open_ports)
    if looks_windows and winrm_user and winrm_pass:
        # Collect listeners and map to processes
        ps_collect = r"""
        $cons = @()
        try {
          $cons = Get-NetTCPConnection -State Listen | Select-Object -Property LocalAddress,LocalPort,OwningProcess
        } catch {
          $cons = @()
        }
        $procs = Get-Process | Select-Object -Property Id, ProcessName, Path
        $results = @()
        foreach ($c in $cons) {
          $p = $procs | Where-Object { $_.Id -eq $c.OwningProcess } | Select-Object -First 1
          $name = if ($p) { $p.ProcessName } else { $null }
          $path = if ($p) { $p.Path } else { $null }
          $results += [pscustomobject]@{ addr = $c.LocalAddress; port = [int]$c.LocalPort; pid = [int]$c.OwningProcess; process = $name; path = $path }
        }
        $results | ConvertTo-Json
        """
        ok1, out1, err1 = winrm_exec(ip, winrm_user, ps_collect, password=winrm_pass, use_tls=winrm_use_tls, port=winrm_port, timeout=winrm_timeout)
        windows_ports: List[Dict[str, Any]] = []
        if ok1 and out1:
            try:
                data = json.loads(out1)
                if isinstance(data, dict):
                    data = [data]
                for e in (data or []):
                    try:
                        windows_ports.append({
                            "addr": e.get("addr"),
                            "port": int(e.get("port")) if e.get("port") is not None else None,
                            "pid": int(e.get("pid")) if e.get("pid") is not None else None,
                            "process": e.get("process"),
                            "path": e.get("path"),
                        })
                    except Exception:
                        pass
            except Exception:
                pass
        base["windows_ports"] = windows_ports
        # Add into services_detailed respecting open_ports filter on frontend
        dets = base.get("services_detailed") or []
        for e in windows_ports:
            svc_name = map_service_from_process_or_port(e.get("process"), e.get("port"))
            dets.append({"service": svc_name, "port": e.get("port"), "verified": True, "detail": e.get("process")})
        base["services_detailed"] = dets
        # OS info from CIM
        ps_os = r"""
        $os = Get-CimInstance Win32_OperatingSystem | Select-Object -Property Caption,Version,BuildNumber
        $os | ConvertTo-Json
        """
        ok2, out2, err2 = winrm_exec(ip, winrm_user, ps_os, password=winrm_pass, use_tls=winrm_use_tls, port=winrm_port, timeout=winrm_timeout)
        if ok2 and out2:
            try:
                os_obj = json.loads(out2)
                caption = os_obj.get("Caption") or None
                if caption:
                    base["os"] = caption
            except Exception:
                pass
    return base


def compose_os_label(base: Dict[str, Any]) -> str:
    """Compose OS label prioritizing real sources (Node Exporter uname, Docker info, Windows Caption)."""
    node = base.get("node_exporter") or {}
    docker = base.get("docker") or {}
    node_uname = node.get("uname") if node.get("present") else None
    docker_os = ((docker.get("info") or {}).get("OperatingSystem")) if docker.get("present") else None
    current = base.get("os")
    return node_uname or docker_os or current or "Unknown"


# ----------------------
# Discovery Endpoints
# ----------------------

@app.post("/api/discovery/network")
def discovery_network(payload: Dict[str, Any] = Body(...)):
    target = payload.get("target")  # expected "start-end" or CIDR
    method = payload.get("method", "tcp")
    sshUser = payload.get("sshUser")
    sshPass = payload.get("sshPass")
    sshKey = payload.get("sshKey")
    sshPort = int(payload.get("sshPort", 22))
    sshTimeout = float(payload.get("sshTimeout", 3.0))
    winrmUser = payload.get("winrmUser")
    winrmPass = payload.get("winrmPass")
    winrmUseTls = bool(payload.get("winrmUseTls", False))
    winrmPort = int(payload.get("winrmPort", 5985))
    winrmTimeout = float(payload.get("winrmTimeout", 4.0))
    discovered: List[Dict[str, Any]] = []
    ips: List[str] = []
    ports: List[int] = get_ports_for_method(method)

    if not target:
        return {"discoveredDevices": []}

    # Parse target
    if "/" in target:
        try:
            net = ipaddress.ip_network(target, strict=False)
            ips = [str(ip) for ip in net.hosts()]
        except Exception:
            ips = []
    elif "-" in target:
        try:
            start, end = target.split("-")
            start_ip = ipaddress.ip_address(start.strip())
            end_ip = ipaddress.ip_address(end.strip())
            cur = int(start_ip)
            end_i = int(end_ip)
            while cur <= end_i:
                ips.append(str(ipaddress.ip_address(cur)))
                cur += 1
        except Exception:
            ips = []

    # Scan ips com lista de portas conforme método
    with ThreadPoolExecutor(max_workers=64) as executor:
        future_map = {executor.submit(discover_host_with_ports, ip, ports): ip for ip in ips}
        for fut in as_completed(future_map):
            host = fut.result()
            # Linux enrichment if SSH creds provided
            host = enrich_linux_details(host["ip"], host, ssh_user=sshUser, ssh_pass=sshPass, ssh_key=sshKey, ssh_port=sshPort, ssh_timeout=sshTimeout)
            # Windows enrichment if WinRM creds provided
            host = enrich_windows_details(host["ip"], host, winrm_user=winrmUser, winrm_pass=winrmPass, winrm_use_tls=winrmUseTls, winrm_port=winrmPort, winrm_timeout=winrmTimeout)
            host["os"] = compose_os_label(host)
            discovered.append({
                "ip": host["ip"],
                "hostname": host["hostname"],
                "status": host["status"],
                "services": [{"service": s} for s in host["services"]],
                "services_detailed": host.get("services_detailed", []),
                "linux_ports": host.get("linux_ports"),
                "windows_ports": host.get("windows_ports"),
                "os": host["os"],
                "virtualization": host.get("virtualization"),
                "timestamp": host["timestamp"],
            })

    return {"method": method, "discoveredDevices": discovered}


@app.post("/api/discovery/cross-platform")
def discovery_cross_platform(payload: Dict[str, Any] = Body(...)):
    targets: List[str] = payload.get("targets", [])
    check_ports: bool = bool(payload.get("checkPorts", True))
    discovered: List[Dict[str, Any]] = []
    for t in targets:
        ip = None
        try:
            ip = socket.gethostbyname(t)
        except Exception:
            pass
        if not ip:
            continue
        host = discover_host(ip) if check_ports else {
            "ip": ip,
            "hostname": t,
            "status": "Unknown",
            "services": [],
            "os": "Unknown",
            "virtualization": None,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        discovered.append(host)
    return {"discoveredDevices": discovered}


# ----------------------
# SNMP (pysnmp)
# ----------------------
try:
    from pysnmp.hlapi import (
        SnmpEngine,
        CommunityData,
        UdpTransportTarget,
        ContextData,
        ObjectType,
        ObjectIdentity,
        getCmd,
        nextCmd,
        setCmd,
        OctetString,
        Integer,
        IpAddress,
        Gauge32,
        Counter32,
        ObjectIdentifier,
    )
    # v3 auth imports (optional)
    try:
        from pysnmp.hlapi import (
            UsmUserData,
            usmHMACMD5AuthProtocol,
            usmHMACSHAAuthProtocol,
            usmHMACSHA256AuthProtocol,
            usmHMACSHA384AuthProtocol,
            usmHMACSHA512AuthProtocol,
            usmNoAuthProtocol,
            usmDESPrivProtocol,
            usmAesCfb128Protocol,
            usmAesCfb192Protocol,
            usmAesCfb256Protocol,
            usmNoPrivProtocol,
        )
    except Exception:
        UsmUserData = None  # type: ignore
        usmHMACMD5AuthProtocol = None  # type: ignore
        usmHMACSHAAuthProtocol = None  # type: ignore
        usmHMACSHA256AuthProtocol = None  # type: ignore
        usmHMACSHA384AuthProtocol = None  # type: ignore
        usmHMACSHA512AuthProtocol = None  # type: ignore
        usmNoAuthProtocol = None  # type: ignore
        usmDESPrivProtocol = None  # type: ignore
        usmAesCfb128Protocol = None  # type: ignore
        usmAesCfb192Protocol = None  # type: ignore
        usmAesCfb256Protocol = None  # type: ignore
        usmNoPrivProtocol = None  # type: ignore
    HAS_PYSNMP = True
except Exception:
    HAS_PYSNMP = False

# --- LLDP/CDP OIDs ---
LLDP_REM_SYSNAME = "1.0.8802.1.1.2.1.4.1.1.9"
LLDP_REM_PORTID = "1.0.8802.1.1.2.1.4.1.1.7"
LLDP_REM_LOCAL_PORTNUM = "1.0.8802.1.1.2.1.4.1.1.2"
LLDP_LOC_PORT_DESC = "1.0.8802.1.1.2.1.3.7.1.3"
LLDP_LOC_PORT_ID = "1.0.8802.1.1.2.1.3.7.1.1"
IF_NAME = "1.3.6.1.2.1.31.1.1.1.1"
IF_DESCR = "1.3.6.1.2.1.2.2.1.2"

CDP_CACHE_DEVICEID = "1.3.6.1.4.1.9.9.23.1.2.1.1.6"
CDP_CACHE_DEVICEPORT = "1.3.6.1.4.1.9.9.23.1.2.1.1.7"
CDP_CACHE_PLATFORM = "1.3.6.1.4.1.9.9.23.1.2.1.1.8"
CDP_CACHE_ADDRESS = "1.3.6.1.4.1.9.9.23.1.2.1.1.4"
CDP_CACHE_IFINDEX = "1.3.6.1.4.1.9.9.23.1.2.1.1.2"


def _snmp_decode(val: Any) -> str:
    try:
        s = str(val)
        return s.strip('"')
    except Exception:
        try:
            return val.prettyPrint()  # type: ignore
        except Exception:
            return str(val)

def snmp_get(ip: str, community: str, oid: str, timeout: int = 1, retries: int = 0) -> Any:
    if not HAS_PYSNMP:
        return None
    try:
        iterator = getCmd(
            SnmpEngine(),
            CommunityData(community, mpModel=0),
            UdpTransportTarget((ip, 161), timeout=timeout, retries=retries),
            ContextData(),
            ObjectType(ObjectIdentity(oid))
        )
        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
        if errorIndication or errorStatus:
            return None
        for varBind in varBinds:
            return varBind[1].prettyPrint()
    except Exception:
        return None

def snmp_walk(ip: str, community: str, oid: str, timeout: int = 1, retries: int = 0) -> List[Tuple[str, Any]]:
    results: List[Tuple[str, Any]] = []
    if not HAS_PYSNMP:
        return results
    try:
        for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(
            SnmpEngine(),
            CommunityData(community, mpModel=0),
            UdpTransportTarget((ip, 161), timeout=timeout, retries=retries),
            ContextData(),
            ObjectType(ObjectIdentity(oid)),
            lexicographicMode=False
        ):
            if errorIndication or errorStatus:
                break
            for varBind in varBinds:
                results.append((str(varBind[0]), varBind[1].prettyPrint()))
    except Exception:
        pass
    return results

# Extended SNMP (v1/v2c/v3)
def _snmp_auth(version: str, community: str, v3: Dict[str, Any] | None):
    if version in ("v1", "v2c"):
        mp = 0 if version == "v1" else 1
        return CommunityData(community, mpModel=mp)
    if version == "v3" and UsmUserData:
        user = (v3 or {}).get("user") or ""
        auth_pass = (v3 or {}).get("authPassword")
        priv_pass = (v3 or {}).get("privPassword")
        auth_proto_name = ((v3 or {}).get("authProtocol") or "").upper()
        priv_proto_name = ((v3 or {}).get("privProtocol") or "").upper()
        auth_proto = {
            "MD5": usmHMACMD5AuthProtocol,
            "SHA": usmHMACSHAAuthProtocol,
            "SHA256": usmHMACSHA256AuthProtocol,
            "SHA384": usmHMACSHA384AuthProtocol,
            "SHA512": usmHMACSHA512AuthProtocol,
        }.get(auth_proto_name, usmNoAuthProtocol)
        priv_proto = {
            "DES": usmDESPrivProtocol,
            "AES128": usmAesCfb128Protocol,
            "AES192": usmAesCfb192Protocol,
            "AES256": usmAesCfb256Protocol,
        }.get(priv_proto_name, usmNoPrivProtocol)
        return UsmUserData(user, auth_pass, auth_proto, priv_pass, priv_proto)
    # default v2c
    return CommunityData(community, mpModel=1)

def snmp_get_ext(ip: str, version: str, community: str, oid: str, v3: Dict[str, Any] | None = None, timeout: int = 1, retries: int = 0) -> Any:
    if not HAS_PYSNMP:
        return None
    try:
        iterator = getCmd(
            SnmpEngine(),
            _snmp_auth(version, community, v3),
            UdpTransportTarget((ip, 161), timeout=timeout, retries=retries),
            ContextData(),
            ObjectType(ObjectIdentity(oid))
        )
        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
        if errorIndication or errorStatus:
            return None
        for varBind in varBinds:
            return varBind[1].prettyPrint()
    except Exception:
        return None

def snmp_walk_ext(ip: str, version: str, community: str, oid: str, v3: Dict[str, Any] | None = None, timeout: int = 1, retries: int = 0) -> List[Tuple[str, Any]]:
    results: List[Tuple[str, Any]] = []
    if not HAS_PYSNMP:
        return results
    try:
        for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(
            SnmpEngine(),
            _snmp_auth(version, community, v3),
            UdpTransportTarget((ip, 161), timeout=timeout, retries=retries),
            ContextData(),
            ObjectType(ObjectIdentity(oid)),
            lexicographicMode=False
        ):
            if errorIndication or errorStatus:
                break
            for varBind in varBinds:
                results.append((str(varBind[0]), varBind[1].prettyPrint()))
    except Exception:
        pass
    return results

# SNMP SET seguro (v1/v2c/v3)
def snmp_set_ext(ip: str, version: str, community: str, oid: str, value_type: str, value: Any, v3: Dict[str, Any] | None = None, timeout: int = 2, retries: int = 0) -> Dict[str, Any]:
    if not HAS_PYSNMP:
        return {"ok": False, "error": "pysnmp não disponível"}
    if not oid:
        return {"ok": False, "error": "OID ausente"}
    type_map = {
        "OctetString": OctetString,
        "Integer": Integer,
        "IpAddress": IpAddress,
        "Gauge32": Gauge32,
        "Counter32": Counter32,
        "ObjectIdentifier": ObjectIdentifier,
    }
    tcls = type_map.get(str(value_type))
    if not tcls:
        return {"ok": False, "error": f"Tipo inválido: {value_type}"}
    try:
        if tcls in (Integer, Gauge32, Counter32):
            vobj = tcls(int(value))
        elif tcls is IpAddress:
            vobj = tcls(str(value))
        else:
            vobj = tcls(value)
    except Exception as e:
        return {"ok": False, "error": f"Falha convertendo valor: {e}"}
    try:
        iterator = setCmd(
            SnmpEngine(),
            _snmp_auth(version, community, v3),
            UdpTransportTarget((ip, 161), timeout=timeout, retries=retries),
            ContextData(),
            ObjectType(ObjectIdentity(oid), vobj)
        )
        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
        if errorIndication:
            return {"ok": False, "error": str(errorIndication)}
        if errorStatus:
            return {"ok": False, "error": f"{errorStatus.prettyPrint()} at {errorIndex}"}
        result_binds: List[Tuple[str, str]] = []
        for varBind in varBinds:
            result_binds.append((str(varBind[0]), varBind[1].prettyPrint()))
        return {"ok": True, "response": result_binds}
    except Exception as e:
        return {"ok": False, "error": str(e)}

# Execução de comandos via Netmiko

def run_netmiko_command(host: str, device_type: str, username: str, password: str, command: str, secret: Optional[str] = None, port: int = 22, timeout: int = 8) -> Dict[str, Any]:
    if ConnectHandler is None:
        return {"ok": False, "error": "netmiko não disponível"}
    if not host or not device_type or not username or not command:
        return {"ok": False, "error": "Parâmetros obrigatórios ausentes"}
    try:
        params: Dict[str, Any] = {
            "device_type": device_type,
            "host": host,
            "username": username,
            "password": password,
            "port": port,
            "timeout": timeout,
        }
        if secret:
            params["secret"] = secret
        conn = ConnectHandler(**params)
        if secret:
            try:
                conn.enable()
            except Exception:
                pass
        output = conn.send_command(command)
        try:
            conn.disconnect()
        except Exception:
            pass
        return {"ok": True, "output": output}
    except Exception as e:
        try:
            conn.disconnect()  # type: ignore
        except Exception:
            pass
        return {"ok": False, "error": str(e)}


def build_snmp_hostinfo(ip: str, community: str, version: str = "v2c", v3: Dict[str, Any] | None = None) -> Dict[str, Any]:
    info: Dict[str, Any] = {"ip": ip, "community": community, "version": version, "available": HAS_PYSNMP}
    if not HAS_PYSNMP:
        return info
    sys_descr = snmp_get_ext(ip, version, community, '1.3.6.1.2.1.1.1.0', v3)
    sys_name = snmp_get_ext(ip, version, community, '1.3.6.1.2.1.1.5.0', v3)
    sys_uptime = snmp_get_ext(ip, version, community, '1.3.6.1.2.1.1.3.0', v3)
    hr_mem = snmp_get_ext(ip, version, community, '1.3.6.1.2.1.25.2.2.0', v3)  # hrMemorySize (in KB)
    cpu_loads = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.25.3.3.1.2', v3)  # hrProcessorLoad
    if_list = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.2.2.1.2', v3)  # ifDescr
    if_speed = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.2.2.1.5', v3)  # ifSpeed
    if_oper = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.2.2.1.8', v3)  # ifOperStatus

    try:
        cpu_vals = [int(v) for _, v in cpu_loads]
        cpu_avg = sum(cpu_vals) / max(1, len(cpu_vals))
    except Exception:
        cpu_avg = None

    interfaces: List[Dict[str, Any]] = []
    for idx, (oid, name) in enumerate(if_list):
        speed = None
        oper = None
        try:
            speed = int(if_speed[idx][1]) if idx < len(if_speed) else None
        except Exception:
            speed = None
        try:
            oper = int(if_oper[idx][1]) if idx < len(if_oper) else None
        except Exception:
            oper = None
        interfaces.append({"name": name, "speed": speed, "operStatus": oper})

    info.update({
        "sysDescr": sys_descr,
        "sysName": sys_name,
        "sysUpTime": sys_uptime,
        "hrMemoryKB": int(hr_mem) if hr_mem and str(hr_mem).isdigit() else None,
        "cpuAvgLoad": cpu_avg,
        "interfaces": interfaces,
    })
    # Disks (hrStorage)
    try:
        descrs = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.25.2.3.1.3', v3)
        units = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.25.2.3.1.4', v3)
        sizes = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.25.2.3.1.5', v3)
        useds = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.25.2.3.1.6', v3)
        def idx_map(items: List[Tuple[str, Any]]):
            m: Dict[str, Any] = {}
            for oid, val in items:
                idx = oid.split('.')[-1]
                m[idx] = val
            return m
        mDescr = idx_map(descrs)
        mUnits = {k: int(v) if str(v).isdigit() else 0 for k, v in idx_map(units).items()}
        mSize = {k: int(v) if str(v).isdigit() else 0 for k, v in idx_map(sizes).items()}
        mUsed = {k: int(v) if str(v).isdigit() else 0 for k, v in idx_map(useds).items()}
        disks: List[Dict[str, Any]] = []
        for k, desc in mDescr.items():
            unit = mUnits.get(k, 0)
            size = mSize.get(k, 0)
            used = mUsed.get(k, 0)
            if unit and size:
                total_bytes = unit * size
                used_bytes = unit * used
                pct = (used_bytes / total_bytes * 100.0) if total_bytes > 0 else None
                disks.append({
                    "descr": desc,
                    "total_bytes": total_bytes,
                    "used_bytes": used_bytes,
                    "used_percent": round(pct, 2) if pct is not None else None,
                })
        info["disks"] = disks
    except Exception:
        info["disks"] = []

    # Processes (hrSWRun)
    try:
        names = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.25.4.2.1.2', v3)
        statuses = snmp_walk_ext(ip, version, community, '1.3.6.1.2.1.25.4.2.1.7', v3)
        total = len(names)
        running = 0
        for _, st in statuses:
            try:
                val = int(st)
                if val == 1:
                    running += 1
            except Exception:
                pass
        info["processes"] = {"total": total, "running": running}
    except Exception:
        info["processes"] = {"total": None, "running": None}
    return info

@app.post("/api/discovery/snmp")
def discovery_snmp(payload: Dict[str, Any] = Body(...)):
    target = payload.get("target")
    community = payload.get("community", "public")
    version = payload.get("version", "v2c")
    v3 = payload.get("v3") or None
    # resolve IP
    try:
        ip = socket.gethostbyname(target)
    except Exception:
        ip = target
    host = discover_host(ip)
    snmp_info = build_snmp_hostinfo(ip, community, version, v3)
    return {
        "target": ip,
        "timestamp": host["timestamp"],
        "systemInfo": {
            "hostname": snmp_info.get("sysName") or host["hostname"],
            "description": snmp_info.get("sysDescr") or host["os"],
            "uptime": snmp_info.get("sysUpTime"),
        },
        "snmp": snmp_info,
        "services": [{"service": s} for s in host["services"]],
    }


def _discover_snmp_neighbors(ip: str, version: str, community: str, v3: Dict[str, Any] | None = None, timeout: int = 1, retries: int = 0) -> List[Dict[str, Any]]:
    neighbors: List[Dict[str, Any]] = []
    try:
        # LLDP primeiro
        rem_sys = snmp_walk_ext(ip, version, community, LLDP_REM_SYSNAME, v3, timeout, retries)
        if rem_sys:
            rem_port = snmp_walk_ext(ip, version, community, LLDP_REM_PORTID, v3, timeout, retries)
            rem_loc_num = snmp_walk_ext(ip, version, community, LLDP_REM_LOCAL_PORTNUM, v3, timeout, retries)
            loc_desc = snmp_walk_ext(ip, version, community, LLDP_LOC_PORT_DESC, v3, timeout, retries)
            rem_map: Dict[str, Dict[str, Any]] = {}
            for oid, val in rem_sys:
                key = oid.split(LLDP_REM_SYSNAME + ".")[-1]
                rem_map[key] = {"remote_hostname": _snmp_decode(val)}
            port_map: Dict[str, str] = {}
            for oid, val in rem_port:
                key = oid.split(LLDP_REM_PORTID + ".")[-1]
                port_map[key] = _snmp_decode(val)
            desc_by_num: Dict[str, str] = {}
            for oid, val in loc_desc:
                suf = oid.split(LLDP_LOC_PORT_DESC + ".")[-1]
                desc_by_num[suf] = _snmp_decode(val)
            for oid, val in rem_loc_num:
                key = oid.split(LLDP_REM_LOCAL_PORTNUM + ".")[-1]
                local_num = _snmp_decode(val)
                local_if = desc_by_num.get(local_num) or f"port-{local_num}"
                ent = rem_map.get(key, {})
                rport = port_map.get(key)
                if ent:
                    neighbors.append({"local_if": local_if, "remote_hostname": ent.get("remote_hostname"), "remote_port": rport, "protocol": "LLDP"})
        # Se LLDP vazio, tenta CDP
        if not neighbors:
            dev_ids = snmp_walk_ext(ip, version, community, CDP_CACHE_DEVICEID, v3, timeout, retries)
            dev_ports = snmp_walk_ext(ip, version, community, CDP_CACHE_DEVICEPORT, v3, timeout, retries)
            if_idxs = snmp_walk_ext(ip, version, community, CDP_CACHE_IFINDEX, v3, timeout, retries)
            if_names = snmp_walk_ext(ip, version, community, IF_NAME, v3, timeout, retries)
            names_map: Dict[str, str] = {}
            for oid, val in if_names:
                suf = oid.split(IF_NAME + ".")[-1]
                names_map[suf] = _snmp_decode(val)
            ports_map: Dict[str, str] = {}
            for oid, val in dev_ports:
                suf = oid.split(CDP_CACHE_DEVICEPORT + ".")[-1]
                ports_map[suf] = _snmp_decode(val)
            for oid, val in dev_ids:
                suf = oid.split(CDP_CACHE_DEVICEID + ".")[-1]
                loc_index = None
                try:
                    loc_index = suf.split(".")[0]
                except Exception:
                    pass
                loc_name = (loc_index and names_map.get(loc_index)) or (loc_index and f"if-{loc_index}") or None
                neighbors.append({"local_if": loc_name, "remote_hostname": _snmp_decode(val), "remote_port": ports_map.get(suf), "protocol": "CDP"})
    except Exception:
        pass
    return neighbors


@app.post("/api/topologia/snmp")
def topologia_snmp(payload: Dict[str, Any] = Body(...)):
    target = payload.get("target")
    community = payload.get("community", "public")
    version = payload.get("version", "v2c")
    v3 = payload.get("v3") or None
    timeout = int(payload.get("timeout", 1))
    retries = int(payload.get("retries", 0))
    try:
        ip = socket.gethostbyname(target)
    except Exception:
        ip = target
    neighbors = _discover_snmp_neighbors(ip, version, community, v3, timeout=timeout, retries=retries)
    src_dev = pg_upsert_device({"ip": ip, "os": "Network", "status": "Online"})
    src_id = src_dev.get("id")
    persisted: List[Dict[str, Any]] = []
    for n in neighbors:
        dst_dev = pg_upsert_device({"hostname": n.get("remote_hostname"), "os": "Network"})
        dst_id = dst_dev.get("id")
        src_if_id = pg_upsert_interface(src_id, n.get("local_if"))
        dst_if_id = pg_upsert_interface(dst_id, n.get("remote_port"))
        pg_upsert_link(src_id, src_if_id, dst_id, dst_if_id, n.get("protocol") or "SNMP")
        persisted.append({"src": src_id, "src_if": n.get("local_if"), "dst": dst_id, "dst_if": n.get("remote_port"), "protocol": n.get("protocol")})
    return {"target": ip, "neighbors": neighbors, "persisted": persisted}


@app.post("/api/snmp/set")
def api_snmp_set(payload: Dict[str, Any] = Body(...), request: Request = None):
    # Rate limiting
    client_ip = request.client.host if request else "unknown"
    if not rate_limit_check(client_ip, "SNMP_SET", RATE_LIMIT_SNMP_SET):
        raise HTTPException(status_code=429, detail="Rate limit exceeded for SNMP_SET")
    
    target = payload.get("target")
    community = payload.get("community", "private")
    version = payload.get("version", "v2c")
    v3 = payload.get("v3") or None
    oid = payload.get("oid")
    value_type = payload.get("type", "OctetString")
    value = payload.get("value")
    timeout = int(payload.get("timeout", 2))
    retries = int(payload.get("retries", 0))
    
    # Validate SNMPv3 if needed
    if version == "v3" and v3:
        validation_errors = validate_snmp_v3(v3)
        if validation_errors:
            raise HTTPException(status_code=400, detail={"errors": validation_errors})
    
    try:
        ip = socket.gethostbyname(target)
    except Exception:
        ip = target
    
    result = snmp_set_ext(ip, version, community, oid, value_type, value, v3, timeout, retries)
    
    try:
        dev = pg_get_device(ip=ip) or pg_upsert_device({"ip": ip, "hostname": payload.get("hostname")})
        dev_id = dev.get("id") if isinstance(dev, dict) else None
        if dev_id:
            ev = pg_add_event(
                dev_id, "SNMP_SET", "info" if result.get("ok") else "error",
                f"SET {oid} ({value_type})", 
                mask_secrets({
                    "oid": oid, "type": value_type, "value": value,
                    "version": version, "timeout": timeout, "retries": retries
                }),
                actor=payload.get("actor", "api"),
                source=client_ip
            )
            result["event_id"] = ev.get("id")
    except Exception:
        pass
    return result


@app.post("/api/netmiko/command")
def api_netmiko_command(payload: Dict[str, Any] = Body(...), request: Request = None):
    # Rate limiting
    client_ip = request.client.host if request else "unknown"
    if not rate_limit_check(client_ip, "NETMIKO_CMD", RATE_LIMIT_NETMIKO_CMD):
        raise HTTPException(status_code=429, detail="Rate limit exceeded for NETMIKO_CMD")
    
    host = payload.get("host")
    device_type = payload.get("deviceType")
    username = payload.get("username")
    password = payload.get("password")
    secret = payload.get("secret")
    command = payload.get("command")
    port = int(payload.get("port", 22))
    timeout = int(payload.get("timeout", 8))
    
    allowed_types = {
        "cisco_ios", "cisco_xe", "cisco_nxos", "cisco_xr",
        "arista_eos", "juniper_junos", "huawei", "hp_procurve",
        "mikrotik_routeros", "ubiquiti_edgerouter", "linux",
    }
    if not device_type or device_type not in allowed_types:
        return {"ok": False, "error": f"deviceType inválido. Permitidos: {sorted(list(allowed_types))}"}
    
    res = run_netmiko_command(host, device_type, username, password, command, secret, port, timeout)
    
    try:
        ip = host
        try:
            ip = socket.gethostbyname(host)
        except Exception:
            pass
        dev = pg_get_device(ip=ip) or pg_upsert_device({"ip": ip, "hostname": payload.get("hostname")})
        dev_id = dev.get("id") if isinstance(dev, dict) else None
        if dev_id:
            ev = pg_add_event(
                dev_id, "NETMIKO_CMD", "info" if res.get("ok") else "error",
                f"CMD: {command}", 
                mask_secrets({
                    "deviceType": device_type, "port": port, "timeout": timeout
                }),
                actor=payload.get("actor", "api"),
                source=client_ip
            )
            res["event_id"] = ev.get("id")
    except Exception:
        pass
    return res


@app.get("/api/discovery/hostinfo")
def discovery_hostinfo(ip: str = Query(...), method: str = Query("tcp"),
                       sshUser: Optional[str] = Query(None), sshPass: Optional[str] = Query(None),
                       sshKey: Optional[str] = Query(None), sshPort: int = Query(22), sshTimeout: float = Query(3.0),
                       winrmUser: Optional[str] = Query(None), winrmPass: Optional[str] = Query(None),
                       winrmUseTls: bool = Query(False), winrmPort: int = Query(5985), winrmTimeout: float = Query(4.0)):
    ports = get_ports_for_method(method)
    base = discover_host_with_ports(ip, ports)
    # Attempt Linux enrichment if SSH credentials are provided
    base = enrich_linux_details(ip, base, ssh_user=sshUser, ssh_pass=sshPass, ssh_key=sshKey, ssh_port=sshPort, ssh_timeout=sshTimeout)
    # Attempt Windows enrichment if WinRM credentials are provided
    base = enrich_windows_details(ip, base, winrm_user=winrmUser, winrm_pass=winrmPass, winrm_use_tls=winrmUseTls, winrm_port=winrmPort, winrm_timeout=winrmTimeout)
    base["os"] = compose_os_label(base)
    return base


@app.get("/api/discovery/docker")
def discovery_docker(ip: str = Query(...),
                     sshUser: Optional[str] = Query(None), sshPass: Optional[str] = Query(None),
                     sshKey: Optional[str] = Query(None), sshPort: int = Query(22), sshTimeout: float = Query(3.0)):
    # Prefer SSH probe if credentials provided; otherwise API probe
    via_api = probe_docker(ip)
    via_ssh: Dict[str, Any] = {}
    if sshUser and (sshPass or sshKey):
        via_ssh = probe_docker_via_ssh(ip, ssh_user=sshUser, ssh_pass=sshPass, ssh_key=sshKey, ssh_port=sshPort, ssh_timeout=sshTimeout)
    # Combine: prefer SSH if present, else API
    if via_ssh.get("present"):
        return via_ssh
    return via_api


# ----------------------
# DB Connectivity Probes (PostgreSQL, MySQL, SQL Server)
# ----------------------

def probe_postgres(ip: str, port: int = 5432, timeout: float = 0.8) -> Dict[str, Any]:
    start = time.time()
    try:
        with socket.create_connection((ip, port), timeout=timeout) as s:
            # Send SSLRequest: length=8, code=80877103
            msg = (8).to_bytes(4, 'big') + (80877103).to_bytes(4, 'big')
            s.sendall(msg)
            resp = s.recv(1)
            latency = (time.time() - start) * 1000
            tls_supported = resp == b'S'
            return {"reachable": True, "latency_ms": round(latency, 2), "tls_supported": tls_supported}
    except Exception as e:
        return {"reachable": False, "error": str(e)}

def probe_mysql(ip: str, port: int = 3306, timeout: float = 0.8) -> Dict[str, Any]:
    start = time.time()
    try:
        with socket.create_connection((ip, port), timeout=timeout) as s:
            s.settimeout(timeout)
            data = s.recv(128)
            latency = (time.time() - start) * 1000
            server_version = None
            if data and len(data) > 5:
                # MySQL sends protocol version (1 byte) then version string null-terminated
                try:
                    idx = 1
                    end = data.find(b'\x00', idx)
                    if end != -1:
                        server_version = data[idx:end].decode(errors='ignore')
                except Exception:
                    server_version = None
            return {"reachable": True, "latency_ms": round(latency, 2), "version": server_version}
    except Exception as e:
        return {"reachable": False, "error": str(e)}

def probe_sqlserver(ip: str, port: int = 1433, timeout: float = 0.8) -> Dict[str, Any]:
    start = time.time()
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            latency = (time.time() - start) * 1000
            return {"reachable": True, "latency_ms": round(latency, 2)}
    except Exception as e:
        return {"reachable": False, "error": str(e)}

def probe_mongodb(ip: str, port: int = 27017, timeout: float = 0.8) -> Dict[str, Any]:
    start = time.time()
    try:
        with socket.create_connection((ip, port), timeout=timeout) as s:
            s.settimeout(timeout)
            try:
                data = s.recv(64)
            except Exception:
                data = b""
            latency = (time.time() - start) * 1000
            return {"reachable": True, "latency_ms": round(latency, 2), "banner": data[:16].hex() if data else None}
    except Exception as e:
        return {"reachable": False, "error": str(e)}

def probe_redis(ip: str, port: int = 6379, timeout: float = 0.8) -> Dict[str, Any]:
    start = time.time()
    try:
        with socket.create_connection((ip, port), timeout=timeout) as s:
            s.settimeout(timeout)
            s.sendall(b"*1\r\n$4\r\nPING\r\n")
            data = s.recv(64)
            latency = (time.time() - start) * 1000
            pong = data.startswith(b"+PONG") if data else False
            return {"reachable": True, "latency_ms": round(latency, 2), "pong": pong}
    except Exception as e:
        return {"reachable": False, "error": str(e)}

def probe_rabbitmq(ip: str, port: int = 5672, timeout: float = 0.8) -> Dict[str, Any]:
    start = time.time()
    try:
        with socket.create_connection((ip, port), timeout=timeout) as s:
            s.settimeout(timeout)
            s.sendall(b"AMQP\x00\x00\x09\x01")
            try:
                data = s.recv(64)
            except Exception:
                data = b""
            latency = (time.time() - start) * 1000
            ready = bool(data)
            return {"reachable": True, "latency_ms": round(latency, 2), "amqp_ready": ready}
    except Exception as e:
        return {"reachable": False, "error": str(e)}

@app.get("/api/discovery/dbprobe")
def discovery_dbprobe(ip: str = Query(...), onlyOnline: bool = Query(True)):
    results: List[Dict[str, Any]] = []
    # Ports mapping
    checks = [
        ("postgresql", 5432, probe_postgres),
        ("postgresql", 5433, probe_postgres),
        ("mysql", 3306, probe_mysql),
        ("sqlserver", 1433, probe_sqlserver),
        ("mongodb", 27017, probe_mongodb),
        ("redis", 6379, probe_redis),
        ("rabbitmq", 5672, probe_rabbitmq),
    ]
    for name, port, fn in checks:
        res = fn(ip, port)
        res.update({"name": name, "port": port})
        results.append(res)
    if onlyOnline:
        results = [r for r in results if r.get("reachable")]
    return {"databases": results}


# ----------------------
# Metrics Aggregation (Node Exporter)
# ----------------------

def compute_cpu_usage(ip: str, idle_cum: float, total_cum: float) -> float | None:
    # usage = 1 - idle_delta / total_delta (PostgreSQL)
    conn = get_pg_conn()
    if not conn:
        return None
    prev_idle_val: float | None = None
    prev_total_val: float | None = None
    try:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT m.value
                FROM "AUTOMACAO"."Metrics" m
                JOIN "AUTOMACAO"."Devices" d ON m.device_id = d.id
                WHERE d.ip = %s AND m.metric_name = 'cpu_idle_cum'
                ORDER BY m.ts DESC
                LIMIT 1
            ''', (ip,))
            row = cur.fetchone()
            if row:
                prev_idle_val = float(row[0])
            cur.execute('''
                SELECT m.value
                FROM "AUTOMACAO"."Metrics" m
                JOIN "AUTOMACAO"."Devices" d ON m.device_id = d.id
                WHERE d.ip = %s AND m.metric_name = 'cpu_total_cum'
                ORDER BY m.ts DESC
                LIMIT 1
            ''', (ip,))
            row = cur.fetchone()
            if row:
                prev_total_val = float(row[0])
    except Exception:
        pass
    finally:
        try:
            conn.close()
        except Exception:
            pass
    if prev_idle_val is None or prev_total_val is None:
        return None
    idle_delta = idle_cum - prev_idle_val
    total_delta = total_cum - prev_total_val
    if total_delta <= 0:
        return None
    usage = max(0.0, min(100.0, (1.0 - (idle_delta / total_delta)) * 100.0))
    return usage

@app.get("/api/discovery/metrics")
def discovery_metrics(ip: str = Query(...), points: int = Query(30)):
    # Poll node exporter and store metrics
    node = probe_node_exporter(ip)
    if not node.get("present"):
        return {"present": False, "series": {}}
    # Store raw counters
    idle_cum = node.get("cpu_idle_cum") or 0.0
    total_cum = node.get("cpu_total_cum") or 0.0
    record_metric(ip, "cpu_idle_cum", idle_cum)
    record_metric(ip, "cpu_total_cum", total_cum)

    # Compute and store aggregates
    cpu_usage = compute_cpu_usage(ip, idle_cum, total_cum)
    if cpu_usage is not None:
        record_metric(ip, "cpu_usage_percent", cpu_usage)
    mem_used = node.get("mem_used_percent")
    if mem_used is not None:
        record_metric(ip, "mem_used_percent", mem_used)
    fs_used = node.get("fs_used_percent")
    if fs_used is not None:
        record_metric(ip, "fs_used_percent", fs_used)
    rx_cum = node.get("net_rx_cum") or 0.0
    tx_cum = node.get("net_tx_cum") or 0.0
    # compute bps via delta from previous sample (PostgreSQL)
    conn = get_pg_conn()
    prev_rx_val: float | None = None
    prev_rx_ts: int | None = None
    prev_tx_val: float | None = None
    prev_tx_ts: int | None = None
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute('''
                    SELECT m.value, EXTRACT(EPOCH FROM m.ts)::bigint AS ts_epoch
                    FROM "AUTOMACAO"."Metrics" m
                    JOIN "AUTOMACAO"."Devices" d ON m.device_id = d.id
                    WHERE d.ip = %s AND m.metric_name = 'net_rx_cum'
                    ORDER BY m.ts DESC
                    LIMIT 1
                ''', (ip,))
                row = cur.fetchone()
                if row:
                    prev_rx_val, prev_rx_ts = float(row[0]), int(row[1])
                cur.execute('''
                    SELECT m.value, EXTRACT(EPOCH FROM m.ts)::bigint AS ts_epoch
                    FROM "AUTOMACAO"."Metrics" m
                    JOIN "AUTOMACAO"."Devices" d ON m.device_id = d.id
                    WHERE d.ip = %s AND m.metric_name = 'net_tx_cum'
                    ORDER BY m.ts DESC
                    LIMIT 1
                ''', (ip,))
                row = cur.fetchone()
                if row:
                    prev_tx_val, prev_tx_ts = float(row[0]), int(row[1])
        except Exception:
            pass
        finally:
            try:
                conn.close()
            except Exception:
                pass
    now_ts = int(time.time())
    record_metric(ip, "net_rx_cum", rx_cum, now_ts)
    record_metric(ip, "net_tx_cum", tx_cum, now_ts)
    if prev_rx_val is not None and prev_rx_ts is not None:
        dt = max(1, now_ts - prev_rx_ts)
        bps = (rx_cum - prev_rx_val) / dt
        record_metric(ip, "net_rx_bps", bps, now_ts)
    if prev_tx_val is not None and prev_tx_ts is not None:
        dt = max(1, now_ts - prev_tx_ts)
        bps = (tx_cum - prev_tx_val) / dt
        record_metric(ip, "net_tx_bps", bps, now_ts)

    # Build series output
    series = {
        "cpu_usage_percent": get_series(ip, "cpu_usage_percent", points),
        "mem_used_percent": get_series(ip, "mem_used_percent", points),
        "fs_used_percent": get_series(ip, "fs_used_percent", points),
        "net_rx_bps": get_series(ip, "net_rx_bps", points),
        "net_tx_bps": get_series(ip, "net_tx_bps", points),
    }
    return {"present": True, "series": series}

# ----------------------
# Inventory endpoints
# ----------------------

@app.get("/api/inventory/hosts")
def inventory_hosts():
    conn = get_pg_conn()
    if not conn:
        return {"hosts": []}
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT ip, hostname, os, status, last_seen FROM "AUTOMACAO"."Devices" ORDER BY COALESCE(updated_at, created_at) DESC')
            rows = cur.fetchall()
        conn.close()
        hosts = []
        for r in rows:
            hosts.append({
                "ip": r[0], "hostname": r[1], "os": r[2], "status": r[3], "last_seen": r[4],
            })
        return {"hosts": hosts}
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return {"hosts": []}

@app.get("/api/inventory/services")
def inventory_services(ip: str | None = Query(None)):
    conn = get_pg_conn()
    if not conn:
        return {"services": []}
    try:
        with conn.cursor() as cur:
            if ip:
                cur.execute('SELECT ip, services FROM "AUTOMACAO"."Devices" WHERE ip = %s', (ip,))
            else:
                cur.execute('SELECT ip, services FROM "AUTOMACAO"."Devices" ORDER BY ip')
            rows = cur.fetchall()
        conn.close()
        services_list: List[Dict[str, Any]] = []
        for row in rows:
            device_ip = row[0]
            services = row[1]
            if isinstance(services, str):
                try:
                    services = json.loads(services or "[]")
                except Exception:
                    services = []
            for s in services or []:
                if isinstance(s, dict):
                    name = s.get("service") or s.get("name") or None
                    port = s.get("port") if isinstance(s.get("port"), int) else None
                    status = s.get("status") or "Unknown"
                else:
                    name = str(s)
                    port = None
                    status = "Unknown"
                services_list.append({"service": name, "port": port, "status": status, "ip": device_ip})
        services_list.sort(key=lambda x: ((x.get("ip") or ""), (x.get("port") or 0)))
        return {"services": services_list}
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return {"services": []}

@app.get("/api/inventory/metrics")
def inventory_metrics(ip: str = Query(...), metric: str = Query(...), limit: int = Query(60)):
    return {"series": get_series(ip, metric, limit)}

# ----------------------
# Quick connectivity tests
# ----------------------
@app.get("/api/test/ping")
def test_ping(ip: str = Query(...), count: int = Query(1), timeout: float = Query(1.0)):
    """Teste de conectividade usando socket TCP ao invés de ping ICMP"""
    start = time.time()
    try:
        # Tenta conectar na porta 80 primeiro, depois 443, depois 22
        test_ports = [80, 443, 22, 8080, 3000]
        reachable = False
        
        for port in test_ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(timeout)
                result = sock.connect_ex((ip, port))
                sock.close()
                if result == 0:
                    reachable = True
                    break
            except:
                continue
        
        latency = (time.time() - start) * 1000
        return {
            "reachable": reachable, 
            "latency_ms": round(latency, 2), 
            "output": f"TCP connectivity test to {ip} - {'SUCCESS' if reachable else 'FAILED'}"
        }
    except Exception as e:
        return {"reachable": False, "error": str(e)}

@app.get("/api/test/ssh")
def test_ssh(ip: str = Query(...), user: Optional[str] = Query(None), password: Optional[str] = Query(None),
             keyPath: Optional[str] = Query(None), port: int = Query(22), timeout: float = Query(2.5)):
    """Teste de conectividade SSH - se não tiver credenciais, testa apenas a porta"""
    
    # Se não tiver usuário, faz apenas teste de conectividade na porta SSH
    if not user:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((ip, port))
            sock.close()
            reachable = result == 0
            return {
                "reachable": reachable, 
                "output": f"SSH port {port} connectivity test - {'SUCCESS' if reachable else 'FAILED'}",
                "error": None if reachable else f"Cannot connect to port {port}"
            }
        except Exception as e:
            return {"reachable": False, "output": None, "error": str(e)}
    
    # Se tiver usuário, tenta autenticação SSH
    if not paramiko:
        return {"reachable": False, "error": "paramiko não disponível"}
    
    ok, out, err = ssh_run_command(ip, user, password=password, key_path=keyPath, port=port, timeout=timeout)
    return {"reachable": ok, "output": out, "error": err}

@app.get("/api/test/snmp")
def test_snmp(ip: str = Query(...), community: str = Query("public"), version: str = Query("v2c")):
    """Teste de conectividade SNMP"""
    if not HAS_PYSNMP:
        return {"reachable": False, "error": "SNMP indisponível - biblioteca pysnmp não instalada", "info": {}}
    
    try:
        info = build_snmp_hostinfo(ip, community, version)
        ok = bool(info.get("sysDescr") or info.get("sysName"))
        return {"reachable": ok, "info": info, "error": None if ok else "Nenhuma resposta SNMP obtida"}
    except Exception as e:
        return {"reachable": False, "error": f"Erro SNMP: {str(e)}", "info": {}}

# ----------------------
# Node Exporter install via SSH (Ubuntu)
# ----------------------
@app.post("/api/actions/node-exporter/install")
def actions_node_exporter_install(payload: Dict[str, Any] = Body(...)):
    if not paramiko:
        return {"ok": False, "error": "paramiko não disponível"}
    ip = payload.get("ip")
    user = payload.get("user")
    password = payload.get("password")
    key_path = payload.get("keyPath")
    port = int(payload.get("port", 22))
    timeout = float(payload.get("timeout", 3.0))
    version = str(payload.get("version", "1.9.1"))
    if isinstance(version, str) and version.lower() in ("latest", "stable"):
        version = "1.9.1"
    force = bool(payload.get("force", False))
    if not ip or not user:
        return {"ok": False, "error": "Parâmetros obrigatórios ausentes: ip/user"}

    # Pre-check: if already active, skip unless force
    if not force:
        ok_pre, out_pre, err_pre = ssh_exec(ip, user, "systemctl is-active node_exporter || true", password=password, key_path=key_path, port=port, timeout=timeout)
        if ok_pre and (out_pre or "") .strip() == "active":
            probe = probe_node_exporter(ip)
            return {"ok": True, "status": "already_running", "probe": probe}

    install_script = f"""
set -e
PM=""
if command -v apt-get >/dev/null 2>&1; then PM="apt"; fi
if command -v dnf >/dev/null 2>&1; then PM="dnf"; fi
if command -v yum >/dev/null 2>&1; then PM="yum"; fi
if command -v zypper >/dev/null 2>&1; then PM="zypper"; fi
install_pkgs() {{
  case "$PM" in
    apt) sudo -n apt-get update -y || true; sudo -n apt-get install -y curl wget || true ;;
    dnf) sudo -n dnf -y install curl wget || true ;;
    yum) sudo -n yum -y install curl wget || true ;;
    zypper) sudo -n zypper -n install -y curl wget || true ;;
    *) true ;;
  esac
}}
install_pkgs
VER="{version}"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) PKG_ARCH="amd64" ;;
  aarch64|arm64) PKG_ARCH="arm64" ;;
  armv7l) PKG_ARCH="armv7" ;;
  *) PKG_ARCH="amd64" ;;
esac
if ! id -u node_exporter >/dev/null 2>&1; then sudo -n useradd --no-create-home --shell /bin/false node_exporter || true; fi
cd /tmp
URL="https://github.com/prometheus/node_exporter/releases/download/v${{VER}}/node_exporter-${{VER}}.linux-${{PKG_ARCH}}.tar.gz"
(curl -fsSL "$URL" -o node_exporter.tar.gz) || (wget -q "$URL" -O node_exporter.tar.gz)
rm -rf node_exporter-${{VER}}.linux-${{PKG_ARCH}}
tar -xzf node_exporter.tar.gz
sudo -n install -m 0755 "node_exporter-${{VER}}.linux-${{PKG_ARCH}}/node_exporter" /usr/local/bin/node_exporter
sudo -n chown node_exporter:node_exporter /usr/local/bin/node_exporter || true
sudo -n bash -c 'cat > /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter --web.listen-address=:9100
Restart=always

[Install]
WantedBy=multi-user.target
EOF'
sudo -n systemctl daemon-reload
sudo -n systemctl enable node_exporter >/dev/null 2>&1 || true
sudo -n systemctl restart node_exporter || sudo -n systemctl start node_exporter
sleep 1
(ss -tulnp 2>/dev/null | grep 9100) || (netstat -tulnp 2>/dev/null | grep 9100) || true
"""

    ok_inst, out_inst, err_inst = ssh_exec(ip, user, install_script, password=password, key_path=key_path, port=port, timeout=max(timeout, 6.0))
    probe = probe_node_exporter(ip)
    # Persist JSON inventory with node_exporter version
    try:
        payload = {
            "ip": ip,
            "services": [{"service": "node_exporter", "port": 9100}],
            "node_exporter": {"installed": True, "version": version, "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")},
            "real": True,
        }
        pg_upsert_device(payload)
    except Exception:
        pass
    return {
        "ok": ok_inst,
        "status": "installed" if probe.get("present") else "not_present",
        "probe": probe,
        "output": out_inst,
        "error": err_inst,
        "version": version
    }

@app.post("/api/actions/node-exporter/stop")
def actions_node_exporter_stop(payload: Dict[str, Any] = Body(...)):
    if not paramiko:
        return {"ok": False, "error": "paramiko não disponível"}
    ip = payload.get("ip")
    user = payload.get("user")
    password = payload.get("password")
    key_path = payload.get("keyPath")
    port = int(payload.get("port", 22))
    timeout = float(payload.get("timeout", 3.0))
    if not ip or not user:
        return {"ok": False, "error": "Parâmetros obrigatórios ausentes: ip/user"}
    ok1, out1, err1 = ssh_exec(ip, user, "sudo -n systemctl stop node_exporter || true && systemctl is-active node_exporter || true", password=password, key_path=key_path, port=port, timeout=timeout)
    status = (out1 or "").strip()
    probe = probe_node_exporter(ip)
    return {"ok": ok1 and status != "active", "status": status or "unknown", "probe": probe, "output": out1, "error": err1}

@app.post("/api/actions/node-exporter/uninstall")
def actions_node_exporter_uninstall(payload: Dict[str, Any] = Body(...)):
    if not paramiko:
        return {"ok": False, "error": "paramiko não disponível"}
    ip = payload.get("ip")
    user = payload.get("user")
    password = payload.get("password")
    key_path = payload.get("keyPath")
    port = int(payload.get("port", 22))
    timeout = float(payload.get("timeout", 3.0))
    if not ip or not user:
        return {"ok": False, "error": "Parâmetros obrigatórios ausentes: ip/user"}
    script = """
sudo -n systemctl stop node_exporter || true
sudo -n systemctl disable node_exporter || true
sudo -n rm -f /etc/systemd/system/node_exporter.service || true
sudo -n systemctl daemon-reload || true
sudo -n rm -f /usr/local/bin/node_exporter || true
sudo -n userdel node_exporter 2>/dev/null || true
"""
    ok, out, err = ssh_exec(ip, user, script, password=password, key_path=key_path, port=port, timeout=max(timeout, 5.0))
    probe = probe_node_exporter(ip)
    try:
        payload = {
            "ip": ip,
            "node_exporter": {"installed": False, "version": None, "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")},
            "real": True,
        }
        pg_upsert_device(payload)
    except Exception:
        pass
    return {"ok": ok and not probe.get("present"), "status": "uninstalled", "probe": probe, "output": out, "error": err}

# ----------------------
# Inventory Persistence (PostgreSQL first, JSON fallback)
# ----------------------



# --- PostgreSQL helpers ---
def pg_ready() -> bool:
    c = get_pg_conn()
    if not c:
        return False
    try:
        c.close()
    except Exception:
        pass
    return True

def pg_list_devices() -> List[Dict[str, Any]]:
    conn = get_pg_conn()
    if not conn:
        return []
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT id, ip, hostname, os, status, services, last_seen, node_exporter, virtualization, real FROM "AUTOMACAO"."Devices" ORDER BY COALESCE(updated_at, created_at) DESC')
            rows = cur.fetchall()
        conn.close()
        devices: List[Dict[str, Any]] = []
        for r in rows:
            services = r[5]
            node_exporter = r[7]
            if isinstance(services, str):
                try:
                    services = json.loads(services or "[]")
                except Exception:
                    services = []
            if isinstance(node_exporter, str):
                try:
                    node_exporter = json.loads(node_exporter or "{}")
                except Exception:
                    node_exporter = None
            devices.append({
                "id": r[0],
                "ip": r[1],
                "hostname": r[2],
                "os": r[3],
                "status": r[4],
                "services": services or [],
                "last_seen": r[6],
                "node_exporter": node_exporter,
                "virtualization": r[8],
                "real": bool(r[9]) if r[9] is not None else True,
            })
        return devices
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return []

def pg_get_device(ip: Optional[str] = None, hostname: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_pg_conn()
    if not conn:
        return None
    try:
        with conn.cursor() as cur:
            if ip:
                cur.execute('SELECT id, ip, hostname, os, status, services, last_seen, node_exporter, virtualization, real FROM "AUTOMACAO"."Devices" WHERE ip = %s', (ip,))
            else:
                cur.execute('SELECT id, ip, hostname, os, status, services, last_seen, node_exporter, virtualization, real FROM "AUTOMACAO"."Devices" WHERE hostname = %s', (hostname,))
            row = cur.fetchone()
        conn.close()
        if not row:
            return None
        services = row[5]
        node_exporter = row[7]
        if isinstance(services, str):
            try:
                services = json.loads(services or "[]")
            except Exception:
                services = []
        if isinstance(node_exporter, str):
            try:
                node_exporter = json.loads(node_exporter or "{}")
            except Exception:
                node_exporter = None
        return {
            "id": row[0], "ip": row[1], "hostname": row[2], "os": row[3], "status": row[4],
            "services": services or [], "last_seen": row[6], "node_exporter": node_exporter,
            "virtualization": row[8], "real": bool(row[9]) if row[9] is not None else True,
        }
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return None

def pg_upsert_device(device: Dict[str, Any]) -> Dict[str, Any]:
    ensure_pg_schema()
    ip = device.get("ip")
    hostname = device.get("hostname")
    os_label = device.get("os") or "Unknown"
    status = device.get("status") or "Unknown"
    last_seen = device.get("lastSeen") or time.strftime("%Y-%m-%d %H:%M:%S")
    # Normalize services to list[str]
    raw_services = device.get("services") or []
    normalized_services: List[Any] = []
    for s in raw_services:
        if isinstance(s, str):
            normalized_services.append(s)
        elif isinstance(s, dict) and ("service" in s or "port" in s):
            normalized_services.append(s)
    node_exporter = device.get("node_exporter") or None
    virtualization = device.get("virtualization")
    real = bool(device.get("real", True))

    # Merge services with existing
    existing = pg_get_device(ip=ip) if ip else pg_get_device(hostname=hostname)
    if existing:
        base_services = existing.get("services") or []
        merged: List[Any] = []
        for s in list(base_services) + list(normalized_services):
            if s not in merged:
                merged.append(s)
        normalized_services = merged

    conn = get_pg_conn()
    if not conn:
        return {
            "ip": ip, "hostname": hostname, "os": os_label, "status": status,
            "services": normalized_services, "last_seen": last_seen,
            "node_exporter": node_exporter, "virtualization": virtualization, "real": real,
        }
    try:
        with conn.cursor() as cur:
            if ip:
                # Try upsert via ip
                cur.execute('''
                    INSERT INTO "AUTOMACAO"."Devices" (ip, hostname, os, status, services, last_seen, node_exporter, virtualization, real, updated_at)
                    VALUES (%s, %s, %s, %s, %s::jsonb, %s, %s::jsonb, %s, %s, NOW())
                    ON CONFLICT (ip) DO UPDATE SET
                        hostname = EXCLUDED.hostname,
                        os = EXCLUDED.os,
                        status = EXCLUDED.status,
                        services = EXCLUDED.services,
                        last_seen = EXCLUDED.last_seen,
                        node_exporter = EXCLUDED.node_exporter,
                        virtualization = EXCLUDED.virtualization,
                        real = EXCLUDED.real,
                        updated_at = NOW()
                    RETURNING id, ip, hostname, os, status, services, last_seen, node_exporter, virtualization, real
                ''', (ip, hostname, os_label, status, json.dumps(normalized_services), last_seen, json.dumps(node_exporter or {}), virtualization, real))
            else:
                # Upsert via hostname
                cur.execute('''
                    INSERT INTO "AUTOMACAO"."Devices" (hostname, ip, os, status, services, last_seen, node_exporter, virtualization, real, updated_at)
                    VALUES (%s, %s, %s, %s, %s::jsonb, %s, %s::jsonb, %s, %s, NOW())
                    ON CONFLICT (hostname) DO UPDATE SET
                        ip = EXCLUDED.ip,
                        os = EXCLUDED.os,
                        status = EXCLUDED.status,
                        services = EXCLUDED.services,
                        last_seen = EXCLUDED.last_seen,
                        node_exporter = EXCLUDED.node_exporter,
                        virtualization = EXCLUDED.virtualization,
                        real = EXCLUDED.real,
                        updated_at = NOW()
                    RETURNING id, ip, hostname, os, status, services, last_seen, node_exporter, virtualization, real
                ''', (hostname, ip, os_label, status, json.dumps(normalized_services), last_seen, json.dumps(node_exporter or {}), virtualization, real))
            row = cur.fetchone()
        conn.close()
        if not row:
            return {
                "ip": ip, "hostname": hostname, "os": os_label, "status": status,
                "services": normalized_services, "last_seen": last_seen,
                "node_exporter": node_exporter, "virtualization": virtualization, "real": real,
            }
        # Decode possible JSON strings
        services = row[5]
        node_exporter = row[7]
        if isinstance(services, str):
            try:
                services = json.loads(services or "[]")
            except Exception:
                services = []
        if isinstance(node_exporter, str):
            try:
                node_exporter = json.loads(node_exporter or "{}")
            except Exception:
                node_exporter = None
        return {
            "id": row[0], "ip": row[1], "hostname": row[2], "os": row[3], "status": row[4],
            "services": services or [], "last_seen": row[6], "node_exporter": node_exporter,
            "virtualization": row[8], "real": bool(row[9]) if row[9] is not None else True,
        }
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return {
            "ip": ip, "hostname": hostname, "os": os_label, "status": status,
            "services": normalized_services, "last_seen": last_seen,
            "node_exporter": node_exporter, "virtualization": virtualization, "real": real,
        }

def pg_upsert_interface(device_id: Optional[int], name: Optional[str], mac: Optional[str] = None, ipv4: Optional[str] = None, ipv6: Optional[str] = None, speed_mbps: Optional[int] = None, status: Optional[str] = None, type_label: Optional[str] = None) -> Optional[int]:
    ensure_pg_schema()
    if not device_id or not name:
        return None
    conn = get_pg_conn()
    if not conn:
        return None
    try:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO "AUTOMACAO"."DeviceInterfaces" (device_id, name, mac, ipv4, ipv6, speed_mbps, status, type, last_seen, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (device_id, name) DO UPDATE SET
                    mac = EXCLUDED.mac,
                    ipv4 = EXCLUDED.ipv4,
                    ipv6 = EXCLUDED.ipv6,
                    speed_mbps = EXCLUDED.speed_mbps,
                    status = EXCLUDED.status,
                    type = EXCLUDED.type,
                    last_seen = NOW(),
                    updated_at = NOW()
                RETURNING id
            ''', (device_id, name, mac, ipv4, ipv6, speed_mbps, status, type_label))
            row = cur.fetchone()
        conn.close()
        return int(row[0]) if row else None
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return None


def pg_upsert_link(src_device_id: Optional[int], src_interface_id: Optional[int], dst_device_id: Optional[int], dst_interface_id: Optional[int], link_type: str = "SNMP", latency_ms: Optional[float] = None, bandwidth_mbps: Optional[int] = None, status: Optional[str] = "discovered") -> Optional[int]:
    ensure_pg_schema()
    if not src_device_id or not dst_device_id:
        return None
    conn = get_pg_conn()
    if not conn:
        return None
    try:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO "AUTOMACAO"."NetworkLinks"
                    (src_device_id, src_interface_id, dst_device_id, dst_interface_id, link_type, latency_ms, bandwidth_mbps, status, discovered_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (src_device_id, dst_device_id, link_type) DO UPDATE SET
                    src_interface_id = EXCLUDED.src_interface_id,
                    dst_interface_id = EXCLUDED.dst_interface_id,
                    latency_ms = EXCLUDED.latency_ms,
                    bandwidth_mbps = EXCLUDED.bandwidth_mbps,
                    status = EXCLUDED.status,
                    updated_at = NOW()
                RETURNING id
            ''', (src_device_id, src_interface_id, dst_device_id, dst_interface_id, link_type, latency_ms, bandwidth_mbps, status))
            row = cur.fetchone()
        conn.close()
        return int(row[0]) if row else None
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return None


def pg_delete_device(device_id: str) -> Dict[str, Any]:
    conn = get_pg_conn()
    if not conn:
        return {"ok": False, "message": "PostgreSQL connection not available"}
    try:
        with conn.cursor() as cur:
            # If numeric id
            try:
                num_id = int(device_id)
                cur.execute('DELETE FROM "AUTOMACAO"."Devices" WHERE id = %s', (num_id,))
            except Exception:
                # Remove by ip or hostname
                cur.execute('DELETE FROM "AUTOMACAO"."Devices" WHERE ip = %s OR hostname = %s', (device_id, device_id))
        conn.close()
        # Return remaining count
        # Best-effort: recount
        rem = pg_list_devices()
        return {"ok": True, "message": "Device removed successfully", "count": len(rem)}
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return {"ok": False, "message": "Failed to remove device"}

# --- JSON fallback helpers ---

# Eventos e manutenção de topologia

def pg_add_event(device_id: int, event_type: str, severity: str = "info", description: Optional[str] = None, 
                 attributes: Optional[Dict[str, Any]] = None, actor: Optional[str] = None, 
                 source: Optional[str] = None) -> Dict[str, Any]:
    ensure_pg_schema()
    conn = get_pg_conn()
    if not conn or not device_id or not event_type:
        return {"ok": False}
    try:
        # Mask sensitive information in attributes
        masked_attributes = mask_secrets(attributes or {})
        
        with conn.cursor() as cur:
            cur.execute(
                'INSERT INTO "AUTOMACAO"."Events"(device_id, event_type, severity, description, attributes, actor, source, ts) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW()) RETURNING id',
                (device_id, event_type, severity, description, json.dumps(masked_attributes), actor, source)
            )
            rid = cur.fetchone()
        conn.close()
        return {"ok": True, "id": rid[0]}
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return {"ok": False}


def pg_list_events(device_id: Optional[int] = None, event_type: Optional[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
    ensure_pg_schema()
    conn = get_pg_conn()
    if not conn:
        return []
    try:
        with conn.cursor() as cur:
            sql = 'SELECT id, device_id, event_type, severity, description, attributes, actor, source, ts FROM "AUTOMACAO"."Events"'
            params: List[Any] = []
            if device_id is not None or event_type is not None:
                sql += ' WHERE '
                conds: List[str] = []
                if device_id is not None:
                    conds.append('device_id = %s')
                    params.append(device_id)
                if event_type is not None:
                    conds.append('event_type = %s')
                    params.append(event_type)
                sql += ' AND '.join(conds)
            sql += ' ORDER BY ts DESC LIMIT %s'
            params.append(limit)
            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
        conn.close()
        return [
            {
                "id": r[0],
                "device_id": r[1],
                "event_type": r[2],
                "severity": r[3],
                "description": r[4],
                "attributes": json.loads(r[5]) if isinstance(r[5], (str, bytes)) else (r[5] or {}),
                "actor": r[6],
                "source": r[7],
                "ts": r[8],
            }
            for r in rows
        ]
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return []


def pg_purge_links(days: int = 30, device_id: Optional[int] = None) -> int:
    ensure_pg_schema()
    conn = get_pg_conn()
    if not conn:
        return 0
    try:
        with conn.cursor() as cur:
            sql = 'DELETE FROM "AUTOMACAO"."NetworkLinks" WHERE updated_at < NOW() - %s::interval'
            params: List[Any] = [f'{max(1, int(days))} days']
            if device_id is not None:
                sql += ' AND (src_device_id = %s OR dst_device_id = %s)'
                params.extend([device_id, device_id])
            cur.execute(sql, tuple(params))
            deleted = cur.rowcount
        conn.close()
        return deleted
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return 0

# Listagem de interfaces e links (topologia)

def pg_list_interfaces(device_id: int) -> List[Dict[str, Any]]:
    ensure_pg_schema()
    conn = get_pg_conn()
    if not conn or not device_id:
        return []
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, name, mac, ipv4, ipv6, speed_mbps, status, type, last_seen, updated_at FROM "AUTOMACAO"."DeviceInterfaces" WHERE device_id = %s ORDER BY name',
                (device_id,)
            )
            rows = cur.fetchall()
        conn.close()
        return [
            {
                "id": r[0],
                "name": r[1],
                "mac": r[2],
                "ipv4": r[3],
                "ipv6": r[4],
                "speed_mbps": r[5],
                "status": r[6],
                "type": r[7],
                "last_seen": r[8],
                "updated_at": r[9],
            }
            for r in rows
        ]
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return []


def pg_list_links(device_id: Optional[int] = None) -> List[Dict[str, Any]]:
    ensure_pg_schema()
    conn = get_pg_conn()
    if not conn:
        return []
    try:
        with conn.cursor() as cur:
            sql = '''
                SELECT
                    l.id,
                    l.src_device_id, sd.hostname AS src_hostname, sd.ip AS src_ip,
                    l.src_interface_id, si.name AS src_if_name,
                    l.dst_device_id, dd.hostname AS dst_hostname, dd.ip AS dst_ip,
                    l.dst_interface_id, di.name AS dst_if_name,
                    l.link_type, l.latency_ms, l.bandwidth_mbps, l.status, l.discovered_at, l.updated_at
                FROM "AUTOMACAO"."NetworkLinks" l
                LEFT JOIN "AUTOMACAO"."Devices" sd ON l.src_device_id = sd.id
                LEFT JOIN "AUTOMACAO"."DeviceInterfaces" si ON l.src_interface_id = si.id
                LEFT JOIN "AUTOMACAO"."Devices" dd ON l.dst_device_id = dd.id
                LEFT JOIN "AUTOMACAO"."DeviceInterfaces" di ON l.dst_interface_id = di.id
            '''
            if device_id is not None:
                sql += ' WHERE l.src_device_id = %s OR l.dst_device_id = %s'
                cur.execute(sql + ' ORDER BY l.updated_at DESC', (device_id, device_id))
            else:
                cur.execute(sql + ' ORDER BY l.updated_at DESC')
            rows = cur.fetchall()
        conn.close()
        return [
            {
                "id": r[0],
                "src_device_id": r[1],
                "src_hostname": r[2],
                "src_ip": r[3],
                "src_interface_id": r[4],
                "src_if_name": r[5],
                "dst_device_id": r[6],
                "dst_hostname": r[7],
                "dst_ip": r[8],
                "dst_interface_id": r[9],
                "dst_if_name": r[10],
                "link_type": r[11],
                "latency_ms": r[12],
                "bandwidth_mbps": r[13],
                "status": r[14],
                "discovered_at": r[15],
                "updated_at": r[16],
            }
            for r in rows
        ]
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return []









def pg_purge_orphan_links() -> Dict[str, Any]:
    """Remove links that reference non-existent devices or interfaces"""
    ensure_pg_schema()
    conn = get_pg_conn()
    if not conn:
        return {"ok": False, "error": "Database connection failed"}
    
    try:
        with conn.cursor() as cur:
            # Remove links with invalid source devices
            cur.execute('''
                DELETE FROM "AUTOMACAO"."NetworkLinks" 
                WHERE src_device_id IS NOT NULL 
                AND src_device_id NOT IN (SELECT id FROM "AUTOMACAO"."Devices")
            ''')
            orphan_src_devices = cur.rowcount
            
            # Remove links with invalid destination devices
            cur.execute('''
                DELETE FROM "AUTOMACAO"."NetworkLinks" 
                WHERE dst_device_id IS NOT NULL 
                AND dst_device_id NOT IN (SELECT id FROM "AUTOMACAO"."Devices")
            ''')
            orphan_dst_devices = cur.rowcount
            
            # Remove links with invalid source interfaces
            cur.execute('''
                DELETE FROM "AUTOMACAO"."NetworkLinks" 
                WHERE src_interface_id IS NOT NULL 
                AND src_interface_id NOT IN (SELECT id FROM "AUTOMACAO"."DeviceInterfaces")
            ''')
            orphan_src_interfaces = cur.rowcount
            
            # Remove links with invalid destination interfaces
            cur.execute('''
                DELETE FROM "AUTOMACAO"."NetworkLinks" 
                WHERE dst_interface_id IS NOT NULL 
                AND dst_interface_id NOT IN (SELECT id FROM "AUTOMACAO"."DeviceInterfaces")
            ''')
            orphan_dst_interfaces = cur.rowcount
            
            total_removed = orphan_src_devices + orphan_dst_devices + orphan_src_interfaces + orphan_dst_interfaces
            
        conn.close()
        return {
            "ok": True,
            "total_removed": total_removed,
            "details": {
                "orphan_src_devices": orphan_src_devices,
                "orphan_dst_devices": orphan_dst_devices,
                "orphan_src_interfaces": orphan_src_interfaces,
                "orphan_dst_interfaces": orphan_dst_interfaces
            }
        }
    except Exception as e:
        try:
            conn.close()
        except Exception:
            pass
        return {"ok": False, "error": str(e)}


def pg_update_link_latency(link_id: int, latency_ms: float) -> bool:
    """Update latency for a specific link"""
    ensure_pg_schema()
    conn = get_pg_conn()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            cur.execute('''
                UPDATE "AUTOMACAO"."NetworkLinks" 
                SET latency_ms = %s, updated_at = NOW() 
                WHERE id = %s
            ''', (latency_ms, link_id))
            updated = cur.rowcount > 0
        conn.close()
        return updated
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return False


# --- Inventory API using PG first ---

@app.post("/api/topologia/links/purge")
def api_topologia_links_purge(payload: Dict[str, Any] = Body(...)):
    days = int(payload.get("days", 30))
    device_id = payload.get("deviceId")
    count = pg_purge_links(days, device_id if isinstance(device_id, int) else None)
    try:
        if isinstance(device_id, int):
            pg_add_event(device_id, "TOPOLOGY_PURGE", "warning",
                         f"Purge de links antigos (> {days} dias)", {"deleted": count})
    except Exception:
        pass
    return {"ok": True, "deleted": count}

@app.post("/api/topologia/links/purge-orphans")
def api_topologia_links_purge_orphans(request: Request = None):
    """Remove links órfãos que referenciam dispositivos ou interfaces inexistentes"""
    client_ip = request.client.host if request else "unknown"
    
    try:
        count = pg_purge_orphan_links()
        
        # Registrar evento de auditoria
        try:
            pg_add_event(None, "TOPOLOGY_ORPHAN_PURGE", "info",
                         f"Purge de links órfãos executado", 
                         {"deleted": count, "client_ip": client_ip},
                         actor=client_ip, source="API")
        except Exception:
            pass
            
        return {"ok": True, "deleted": count, "message": f"Removidos {count} links órfãos"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/topologia/links/update-latency")
def api_topologia_links_update_latency(payload: Dict[str, Any] = Body(...), request: Request = None):
    """Atualiza a latência de um link específico"""
    client_ip = request.client.host if request else "unknown"
    
    try:
        link_id = payload.get("linkId")
        if not link_id:
            return {"ok": False, "error": "linkId é obrigatório"}
        
        # Buscar informações do link
        with get_pg_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT l.id, d1.ip as src_ip, d2.ip as dst_ip, l.src_port, l.dst_port
                    FROM Links l
                    JOIN Devices d1 ON l.src_device_id = d1.id
                    JOIN Devices d2 ON l.dst_device_id = d2.id
                    WHERE l.id = %s
                """, (link_id,))
                link_info = cur.fetchone()
                
                if not link_info:
                    return {"ok": False, "error": "Link não encontrado"}
                
                # Medir latência TCP
                latency = measure_tcp_latency(link_info[2], link_info[4] or 22)  # dst_ip, dst_port
                
                if latency is not None:
                    success = pg_update_link_latency(link_id, latency)
                    
                    # Registrar evento
                    try:
                        pg_add_event(None, "LINK_LATENCY_UPDATE", "info",
                                     f"Latência do link {link_id} atualizada: {latency:.2f}ms",
                                     {"link_id": link_id, "latency_ms": latency, "client_ip": client_ip},
                                     actor=client_ip, source="API")
                    except Exception:
                        pass
                    
                    return {"ok": True, "updated": success, "latency_ms": latency}
                else:
                    return {"ok": False, "error": "Não foi possível medir a latência"}
                    
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/topologia/links/probe-latency")
def api_topologia_links_probe_latency(payload: Dict[str, Any] = Body(...), request: Request = None):
    """Executa sondas ativas de latência em lote para todos os links ou links específicos"""
    client_ip = request.client.host if request else "unknown"
    
    try:
        device_id = payload.get("deviceId")  # Opcional: filtrar por dispositivo
        max_concurrent = min(payload.get("maxConcurrent", 10), 20)  # Máximo 20 threads
        timeout = min(payload.get("timeout", 2.0), 5.0)  # Máximo 5s timeout
        
        # Buscar links para sondar
        with get_pg_conn() as conn:
            with conn.cursor() as cur:
                if device_id:
                    cur.execute("""
                        SELECT l.id, d1.ip as src_ip, d2.ip as dst_ip, l.src_port, l.dst_port,
                               d1.hostname as src_hostname, d2.hostname as dst_hostname
                        FROM Links l
                        JOIN Devices d1 ON l.src_device_id = d1.id
                        JOIN Devices d2 ON l.dst_device_id = d2.id
                        WHERE l.src_device_id = %s OR l.dst_device_id = %s
                        ORDER BY l.id
                    """, (device_id, device_id))
                else:
                    cur.execute("""
                        SELECT l.id, d1.ip as src_ip, d2.ip as dst_ip, l.src_port, l.dst_port,
                               d1.hostname as src_hostname, d2.hostname as dst_hostname
                        FROM Links l
                        JOIN Devices d1 ON l.src_device_id = d1.id
                        JOIN Devices d2 ON l.dst_device_id = d2.id
                        ORDER BY l.id
                        LIMIT 100
                    """)
                
                links = cur.fetchall()
        
        if not links:
            return {"ok": True, "probed": 0, "results": [], "message": "Nenhum link encontrado"}
        
        results = []
        updated_count = 0
        
        def probe_link(link_info):
            link_id, src_ip, dst_ip, src_port, dst_port, src_hostname, dst_hostname = link_info
            
            # Tentar medir latência para ambas as direções
            latency_forward = measure_tcp_latency(dst_ip, dst_port or 22, timeout)
            latency_reverse = measure_tcp_latency(src_ip, src_port or 22, timeout)
            
            # Usar a melhor latência disponível
            best_latency = None
            if latency_forward is not None and latency_reverse is not None:
                best_latency = min(latency_forward, latency_reverse)
            elif latency_forward is not None:
                best_latency = latency_forward
            elif latency_reverse is not None:
                best_latency = latency_reverse
            
            result = {
                "link_id": link_id,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_hostname": src_hostname,
                "dst_hostname": dst_hostname,
                "latency_forward_ms": latency_forward,
                "latency_reverse_ms": latency_reverse,
                "best_latency_ms": best_latency,
                "updated": False
            }
            
            # Atualizar no banco se temos latência
            if best_latency is not None:
                result["updated"] = pg_update_link_latency(link_id, best_latency)
            
            return result
        
        # Executar sondas em paralelo
        with ThreadPoolExecutor(max_workers=max_concurrent) as executor:
            future_to_link = {executor.submit(probe_link, link): link for link in links}
            
            for future in as_completed(future_to_link):
                try:
                    result = future.result()
                    results.append(result)
                    if result["updated"]:
                        updated_count += 1
                except Exception as e:
                    link_info = future_to_link[future]
                    results.append({
                        "link_id": link_info[0],
                        "src_ip": link_info[1],
                        "dst_ip": link_info[2],
                        "error": str(e),
                        "updated": False
                    })
        
        # Registrar evento de auditoria
        try:
            pg_add_event(device_id, "LINK_LATENCY_PROBE", "info",
                         f"Sonda de latência executada: {len(links)} links, {updated_count} atualizados",
                         {
                             "total_links": len(links),
                             "updated_count": updated_count,
                             "device_id": device_id,
                             "client_ip": client_ip,
                             "max_concurrent": max_concurrent,
                             "timeout": timeout
                         },
                         actor=client_ip, source="API")
        except Exception:
            pass
        
        return {
            "ok": True,
            "probed": len(links),
            "updated": updated_count,
            "results": results,
            "message": f"Sondagem concluída: {updated_count}/{len(links)} links atualizados"
        }
        
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/api/events")
def api_list_events(deviceId: Optional[int] = Query(None), eventType: Optional[str] = Query(None), limit: int = Query(200)):
    return {"ok": True, "events": pg_list_events(deviceId, eventType, limit)}

@app.get("/api/topologia/interfaces")
def api_topologia_interfaces(deviceId: int = Query(...)):
    return {"deviceId": deviceId, "interfaces": pg_list_interfaces(deviceId)}

@app.get("/api/topologia/links")
def api_topologia_links(deviceId: Optional[int] = Query(None)):
    return {"links": pg_list_links(deviceId)}

@app.get("/api/topologia/grafo")
def api_topologia_grafo():
    nodes_raw = pg_list_devices()
    nodes = [
        {
            "id": n.get("id"),
            "label": n.get("hostname") or n.get("ip"),
            "ip": n.get("ip"),
            "os": n.get("os"),
            "status": n.get("status"),
        }
        for n in nodes_raw
    ]
    links = pg_list_links()
    edges = [
        {
            "id": l["id"],
            "source": l["src_device_id"],
            "target": l["dst_device_id"],
            "src_if": l.get("src_if_name"),
            "dst_if": l.get("dst_if_name"),
            "type": l.get("link_type"),
            "status": l.get("status"),
        }
        for l in links
    ]
    return {"nodes": nodes, "edges": edges}
@app.get("/api/inventory/devices")
def list_devices_json():
    return {"devices": pg_list_devices()}

@app.post("/api/inventory/devices")
def add_or_update_device_json(payload: Dict[str, Any] = Body(...)):
    dev = pg_upsert_device(payload or {})
    count = len(pg_list_devices())
    return {"ok": True, "device": dev, "count": count}

@app.delete("/api/inventory/devices/{device_id}")
def remove_device_json(device_id: str):
    return pg_delete_device(device_id)

# --- Graph Export Functions ---

def export_graph_json() -> Dict[str, Any]:
    """Exporta o grafo de topologia em formato JSON"""
    try:
        # Buscar dispositivos
        devices = pg_list_devices()
        
        # Buscar links
        links = pg_list_links()
        
        # Preparar nós
        nodes = []
        for device in devices:
            node = {
                "id": device.get("id"),
                "label": device.get("hostname") or device.get("ip"),
                "ip": device.get("ip"),
                "hostname": device.get("hostname"),
                "os": device.get("os"),
                "status": device.get("status"),
                "vendor": device.get("vendor"),
                "model": device.get("model"),
                "version": device.get("version"),
                "location": device.get("location"),
                "description": device.get("description"),
                "last_seen": device.get("last_seen"),
                "created_at": device.get("created_at")
            }
            nodes.append(node)
        
        # Preparar arestas
        edges = []
        for link in links:
            edge = {
                "id": link.get("id"),
                "source": link.get("src_device_id"),
                "target": link.get("dst_device_id"),
                "src_interface": link.get("src_interface"),
                "dst_interface": link.get("dst_interface"),
                "src_port": link.get("src_port"),
                "dst_port": link.get("dst_port"),
                "protocol": link.get("protocol"),
                "latency_ms": link.get("latency_ms"),
                "bandwidth": link.get("bandwidth"),
                "status": link.get("status"),
                "discovered_at": link.get("discovered_at"),
                "last_seen": link.get("last_seen")
            }
            edges.append(edge)
        
        return {
            "format": "json",
            "version": "1.0",
            "generated_at": datetime.datetime.now().isoformat(),
            "metadata": {
                "nodes_count": len(nodes),
                "edges_count": len(edges),
                "description": "Network topology graph exported from CMM Analytics"
            },
            "graph": {
                "nodes": nodes,
                "edges": edges
            }
        }
        
    except Exception as e:
        raise Exception(f"Erro ao exportar grafo JSON: {str(e)}")

def export_graph_graphml() -> str:
    """Exporta o grafo de topologia em formato GraphML"""
    try:
        # Buscar dados
        devices = pg_list_devices()
        links = pg_list_links()
        
        # Criar elemento raiz GraphML
        graphml = ET.Element("graphml")
        graphml.set("xmlns", "http://graphml.graphdrawing.org/xmlns")
        graphml.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
        graphml.set("xsi:schemaLocation", "http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd")
        
        # Definir atributos dos nós
        node_attrs = [
            ("label", "string", "Node Label"),
            ("ip", "string", "IP Address"),
            ("hostname", "string", "Hostname"),
            ("os", "string", "Operating System"),
            ("status", "string", "Status"),
            ("vendor", "string", "Vendor"),
            ("model", "string", "Model"),
            ("version", "string", "Version"),
            ("location", "string", "Location"),
            ("description", "string", "Description")
        ]
        
        for i, (attr_name, attr_type, attr_desc) in enumerate(node_attrs):
            key_elem = ET.SubElement(graphml, "key")
            key_elem.set("id", f"n{i}")
            key_elem.set("for", "node")
            key_elem.set("attr.name", attr_name)
            key_elem.set("attr.type", attr_type)
            desc_elem = ET.SubElement(key_elem, "desc")
            desc_elem.text = attr_desc
        
        # Definir atributos das arestas
        edge_attrs = [
            ("src_interface", "string", "Source Interface"),
            ("dst_interface", "string", "Destination Interface"),
            ("src_port", "int", "Source Port"),
            ("dst_port", "int", "Destination Port"),
            ("protocol", "string", "Protocol"),
            ("latency_ms", "double", "Latency (ms)"),
            ("bandwidth", "string", "Bandwidth"),
            ("status", "string", "Status")
        ]
        
        for i, (attr_name, attr_type, attr_desc) in enumerate(edge_attrs):
            key_elem = ET.SubElement(graphml, "key")
            key_elem.set("id", f"e{i}")
            key_elem.set("for", "edge")
            key_elem.set("attr.name", attr_name)
            key_elem.set("attr.type", attr_type)
            desc_elem = ET.SubElement(key_elem, "desc")
            desc_elem.text = attr_desc
        
        # Criar grafo
        graph = ET.SubElement(graphml, "graph")
        graph.set("id", "NetworkTopology")
        graph.set("edgedefault", "undirected")
        
        # Adicionar nós
        for device in devices:
            node = ET.SubElement(graph, "node")
            node.set("id", str(device.get("id")))
            
            for i, (attr_name, _, _) in enumerate(node_attrs):
                value = device.get(attr_name)
                if value is not None:
                    data = ET.SubElement(node, "data")
                    data.set("key", f"n{i}")
                    data.text = str(value)
        
        # Adicionar arestas
        for link in links:
            edge = ET.SubElement(graph, "edge")
            edge.set("id", str(link.get("id")))
            edge.set("source", str(link.get("src_device_id")))
            edge.set("target", str(link.get("dst_device_id")))
            
            for i, (attr_name, _, _) in enumerate(edge_attrs):
                value = link.get(attr_name)
                if value is not None:
                    data = ET.SubElement(edge, "data")
                    data.set("key", f"e{i}")
                    data.text = str(value)
        
        # Converter para string
        ET.indent(graphml, space="  ")
        return ET.tostring(graphml, encoding="unicode", xml_declaration=True)
        
    except Exception as e:
        raise Exception(f"Erro ao exportar grafo GraphML: {str(e)}")

# --- Graph Export Endpoints ---

@app.get("/api/topologia/export/json")
def api_topologia_export_json(request: Request = None):
    """Exporta o grafo de topologia em formato JSON"""
    client_ip = request.client.host if request else "unknown"
    
    try:
        graph_data = export_graph_json()
        
        # Registrar evento de auditoria
        try:
            pg_add_event(None, "TOPOLOGY_EXPORT", "info",
                         "Exportação de grafo em formato JSON",
                         {
                             "format": "json",
                             "nodes_count": graph_data["metadata"]["nodes_count"],
                             "edges_count": graph_data["metadata"]["edges_count"],
                             "client_ip": client_ip
                         },
                         actor=client_ip, source="API")
        except Exception:
            pass
        
        return graph_data
        
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/api/topologia/export/graphml")
def api_topologia_export_graphml(request: Request = None):
    """Exporta o grafo de topologia em formato GraphML"""
    client_ip = request.client.host if request else "unknown"
    
    try:
        graphml_content = export_graph_graphml()
        
        # Registrar evento de auditoria
        try:
            devices_count = len(pg_list_devices())
            links_count = len(pg_list_links())
            
            pg_add_event(None, "TOPOLOGY_EXPORT", "info",
                         "Exportação de grafo em formato GraphML",
                         {
                             "format": "graphml",
                             "nodes_count": devices_count,
                             "edges_count": links_count,
                             "client_ip": client_ip
                         },
                         actor=client_ip, source="API")
        except Exception:
            pass
        
        # Retornar como resposta XML
        return Response(
            content=graphml_content,
            media_type="application/xml",
            headers={
                "Content-Disposition": "attachment; filename=network_topology.graphml"
            }
        )
        
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/api/topologia/export/formats")
def api_topologia_export_formats():
    """Lista os formatos de exportação disponíveis"""
    return {
        "ok": True,
        "formats": [
            {
                "name": "json",
                "description": "JSON format with nodes and edges",
                "endpoint": "/api/topologia/export/json",
                "content_type": "application/json"
            },
            {
                "name": "graphml",
                "description": "GraphML XML format for graph analysis tools",
                "endpoint": "/api/topologia/export/graphml",
                "content_type": "application/xml"
            }
        ]
    }


# Initialize DB at startup
ensure_pg_schema()