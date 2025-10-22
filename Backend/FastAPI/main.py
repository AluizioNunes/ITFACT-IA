from fastapi import FastAPI, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Tuple, Optional
import socket
import ipaddress
import time
import requests
import sqlite3
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
# SQLite Persistence
# ----------------------

DB_PATH = os.environ.get("DB_PATH", str(Path(__file__).with_name("discovery.db")))

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS hosts (
            ip TEXT PRIMARY KEY,
            hostname TEXT,
            os TEXT,
            status TEXT,
            last_seen TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT,
            service TEXT,
            port INTEGER,
            status TEXT,
            extra TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT,
            metric TEXT,
            value REAL,
            ts INTEGER
        )
        """
    )
    conn.commit()
    conn.close()

def record_discovery_host(ip: str, hostname: str, os: str, status: str, services: List[Tuple[str,int]]):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "REPLACE INTO hosts (ip, hostname, os, status, last_seen) VALUES (?, ?, ?, ?, ?)",
        (ip, hostname, os, status, time.strftime("%Y-%m-%d %H:%M:%S"))
    )
    # purge old services for this ip
    cur.execute("DELETE FROM services WHERE ip = ?", (ip,))
    for svc, port in services:
        cur.execute(
            "INSERT INTO services (ip, service, port, status, extra) VALUES (?, ?, ?, ?, ?)",
            (ip, svc, port, status, None)
        )
    conn.commit()
    conn.close()

def record_metric(ip: str, metric: str, value: float, ts: int | None = None):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO metrics (ip, metric, value, ts) VALUES (?, ?, ?, ?)",
        (ip, metric, float(value), int(ts or time.time()))
    )
    conn.commit()
    conn.close()

def get_series(ip: str, metric: str, limit: int = 60) -> List[Dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT value, ts FROM metrics WHERE ip = ? AND metric = ? ORDER BY ts DESC LIMIT ?",
        (ip, metric, limit)
    )
    rows = cur.fetchall()
    conn.close()
    # return in ascending time order
    return [{"time": time.strftime("%H:%M:%S", time.localtime(r["ts"])), "value": float(r["value"]) } for r in reversed(rows)]


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
    # usage = 1 - idle_delta / total_delta
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT value, ts FROM metrics WHERE ip=? AND metric='cpu_idle_cum' ORDER BY ts DESC LIMIT 1",
        (ip,)
    )
    prev_idle = cur.fetchone()
    cur.execute(
        "SELECT value, ts FROM metrics WHERE ip=? AND metric='cpu_total_cum' ORDER BY ts DESC LIMIT 1",
        (ip,)
    )
    prev_total = cur.fetchone()
    conn.close()
    if not prev_idle or not prev_total:
        return None
    idle_delta = idle_cum - float(prev_idle["value"])
    total_delta = total_cum - float(prev_total["value"])
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
    # compute bps via delta from previous sample
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT value, ts FROM metrics WHERE ip=? AND metric='net_rx_cum' ORDER BY ts DESC LIMIT 1", (ip,))
    prev_rx = cur.fetchone()
    cur.execute("SELECT value, ts FROM metrics WHERE ip=? AND metric='net_tx_cum' ORDER BY ts DESC LIMIT 1", (ip,))
    prev_tx = cur.fetchone()
    conn.close()
    now_ts = int(time.time())
    record_metric(ip, "net_rx_cum", rx_cum, now_ts)
    record_metric(ip, "net_tx_cum", tx_cum, now_ts)
    if prev_rx:
        dt = max(1, now_ts - int(prev_rx["ts"]))
        bps = (rx_cum - float(prev_rx["value"])) / dt
        record_metric(ip, "net_rx_bps", bps, now_ts)
    if prev_tx:
        dt = max(1, now_ts - int(prev_tx["ts"]))
        bps = (tx_cum - float(prev_tx["value"])) / dt
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
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT ip, hostname, os, status, last_seen FROM hosts ORDER BY last_seen DESC")
    rows = cur.fetchall()
    conn.close()
    return {"hosts": [dict(r) for r in rows]}

@app.get("/api/inventory/services")
def inventory_services(ip: str | None = Query(None)):
    conn = get_db()
    cur = conn.cursor()
    if ip:
        cur.execute("SELECT service, port, status, ip FROM services WHERE ip=? ORDER BY port", (ip,))
    else:
        cur.execute("SELECT service, port, status, ip FROM services ORDER BY ip, port")
    rows = cur.fetchall()
    conn.close()
    return {"services": [dict(r) for r in rows]}

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
        upsert_server_json({
            "ip": ip,
            "services": [{"service": "node_exporter", "port": 9100}],
            "node_exporter": {"installed": True, "version": version, "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")},
            "real": True,
        })
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
        upsert_server_json({
            "ip": ip,
            "node_exporter": {"installed": False, "version": None, "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")},
            "real": True,
        })
    except Exception:
        pass
    return {"ok": ok and not probe.get("present"), "status": "uninstalled", "probe": probe, "output": out, "error": err}

# ----------------------
# JSON Inventory (file-based)
# ----------------------
INVENTORY_DIR = Path(__file__).with_name("Inventory")
SERVERS_JSON = INVENTORY_DIR / "Servers.json"

def ensure_inventory_fs():
    try:
        INVENTORY_DIR.mkdir(parents=True, exist_ok=True)
        if not SERVERS_JSON.exists():
            SERVERS_JSON.write_text("[]", encoding="utf-8")
    except Exception:
        pass

def load_servers_json() -> List[Dict[str, Any]]:
    ensure_inventory_fs()
    try:
        text = SERVERS_JSON.read_text(encoding="utf-8")
        data = json.loads(text or "[]")
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []

def save_servers_json(items: List[Dict[str, Any]]) -> None:
    ensure_inventory_fs()
    try:
        SERVERS_JSON.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass

def upsert_server_json(device: Dict[str, Any]) -> Dict[str, Any]:
    items = load_servers_json()
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    ip = device.get("ip")
    hostname = device.get("hostname")
    dev = {
        "ip": ip,
        "hostname": hostname,
        "os": device.get("os") or "Unknown",
        "status": device.get("status") or "Unknown",
        "services": device.get("services") or [],
        "last_seen": device.get("lastSeen") or now,
        "node_exporter": device.get("node_exporter"),
        "virtualization": device.get("virtualization"),
        "real": bool(device.get("real", True)),
    }
    updated = False
    for idx, it in enumerate(items):
        if (ip and it.get("ip") == ip) or (hostname and it.get("hostname") == hostname):
            base_services = it.get("services") or []
            new_services = dev["services"] or []
            merged = []
            for s in base_services + new_services:
                if s not in merged:
                    merged.append(s)
            dev["services"] = merged
            it.update(dev)
            items[idx] = it
            updated = True
            dev = it
            break
    if not updated:
        items.append(dev)
    save_servers_json(items)
    return dev

@app.get("/api/inventory/devices")
def list_devices_json():
    return {"devices": load_servers_json()}

@app.post("/api/inventory/devices")
def add_or_update_device_json(payload: Dict[str, Any] = Body(...)):
    dev = upsert_server_json(payload or {})
    return {"ok": True, "device": dev, "count": len(load_servers_json())}

@app.delete("/api/inventory/devices/{device_id}")
def remove_device_json(device_id: str):
    items = load_servers_json()
    original_count = len(items)
    
    # Try to remove by IP or hostname
    items = [item for item in items if item.get("ip") != device_id and item.get("hostname") != device_id]
    
    if len(items) < original_count:
        save_servers_json(items)
        return {"ok": True, "message": "Device removed successfully", "count": len(items)}
    else:
        return {"ok": False, "message": "Device not found", "count": len(items)}


# Initialize DB at startup
init_db()