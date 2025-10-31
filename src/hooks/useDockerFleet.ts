import { useEffect, useMemo, useRef, useState } from 'react';

type Server = { ip: string; hostname?: string };
type FleetContainer = {
  id?: string;
  name?: string;
  image?: string;
  status?: string;
  state?: string;
  ports?: any;
  running?: boolean;
  logs_tail?: string | null;
  host?: string; // hostname or ip
  ip?: string;
};

type FleetSummary = {
  total: number;
  running: number;
  stopped: number;
};

export function useDockerFleet() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedIps, setSelectedIps] = useState<string[]>([]);
  const [containers, setContainers] = useState<FleetContainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchServers = async () => {
    try {
      setError(null);
      const r = await fetch('/api/inventory/devices');
      let list: Server[] = [];
      if (r.ok) {
        const j = await r.json();
        const devices = Array.isArray(j?.devices) ? j.devices : [];
        list = devices.map((d: any) => ({ ip: d.ip, hostname: d.hostname }))
          .filter((d: Server) => !!d.ip);
      }
      // Garantir localhost no conjunto
      list.push({ ip: 'localhost', hostname: 'localhost' });
      // Dedup por IP
      const seen = new Set<string>();
      const dedup = list.filter((s) => {
        if (seen.has(s.ip)) return false;
        seen.add(s.ip);
        return true;
      });
      setServers(dedup);
      // Seleção padrão: todos
      setSelectedIps(dedup.map((s) => s.ip));
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar lista de servidores');
      // Fallback para apenas localhost
      setServers([{ ip: 'localhost', hostname: 'localhost' }]);
      setSelectedIps(['localhost']);
    }
  };

  const fetchFleet = async (ips: string[]) => {
    try {
      setLoading(true);
      setError(null);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const calls = ips.map((ip) =>
        fetch(`/api/discovery/docker?ip=${encodeURIComponent(ip)}`, { signal: ac.signal })
          .then(async (r) => ({ ip, ok: r.ok, json: r.ok ? await r.json() : null }))
          .catch(() => ({ ip, ok: false, json: null }))
      );
      const results = await Promise.allSettled(calls);
      const agg: FleetContainer[] = [];
      results.forEach((res: any) => {
        if (res.status === 'fulfilled') {
          const { ip, ok, json } = res.value || {};
          if (ok && json && Array.isArray(json.containers)) {
            const hostLabel = servers.find((s) => s.ip === ip)?.hostname || ip;
            json.containers.forEach((c: any) => {
              const running = typeof c.running === 'boolean'
                ? c.running
                : /up|running/i.test(String(c.status || c.state || ''));
              agg.push({
                id: c.id,
                name: c.name,
                image: c.image,
                status: c.status,
                state: c.state,
                ports: c.ports,
                running,
                logs_tail: c.logs_tail,
                host: hostLabel,
                ip,
              });
            });
          }
        }
      });
      setContainers(agg);
    } catch (e: any) {
      setError(e?.message || 'Falha ao consultar containers do fleet');
      setContainers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (servers.length === 0) return;
    const ips = selectedIps.length > 0 ? selectedIps : servers.map((s) => s.ip);
    fetchFleet(ips);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers, selectedIps]);

  const summary: FleetSummary = useMemo(() => {
    const total = containers.length;
    const running = containers.filter((c) => c.running).length;
    return { total, running, stopped: total - running };
  }, [containers]);

  const refetch = () => {
    const ips = selectedIps.length > 0 ? selectedIps : servers.map((s) => s.ip);
    fetchFleet(ips);
  };

  return {
    servers,
    selectedIps,
    setSelectedIps,
    containers,
    summary,
    loading,
    error,
    refetch,
  };
}