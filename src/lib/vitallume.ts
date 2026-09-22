import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_DEVICE_ID = "vitallume-001";

export type SensorReading = {
  id: string;
  device_id: string;
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  gas: number | null;
  sound: number | null;
  motion: boolean;
  presence: boolean;
  classification: string;
  risk_level: string;
  activity_pattern: string;
  confidence: number;
};

export type Alert = {
  id: string;
  device_id: string;
  type: string;
  severity: string;
  message: string;
  sensor: string | null;
  value: number | null;
  threshold: number | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  timestamp: string;
};

export type DevicePublic = {
  id: string;
  device_id: string;
  name: string;
  status: string;
  last_seen: string | null;
};

const OFFLINE_TIMEOUT_MS = 60_000;

export function isOnline(lastSeen: string | null | undefined) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < OFFLINE_TIMEOUT_MS;
}

export function useLiveHome(deviceId: string = DEFAULT_DEVICE_ID) {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [device, setDevice] = useState<DevicePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    const [r, a, d] = await Promise.all([
      supabase
        .from("sensor_readings")
        .select("*")
        .eq("device_id", deviceId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("alerts")
        .select("*")
        .eq("device_id", deviceId)
        .order("timestamp", { ascending: false })
        .limit(50),
      supabase.from("devices_public").select("*").eq("device_id", deviceId).maybeSingle(),
    ]);
    setReading((r.data as SensorReading | null) ?? null);
    setAlerts((a.data as Alert[] | null) ?? []);
    setDevice((d.data as DevicePublic | null) ?? null);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel(`vitallume-${deviceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sensor_readings" }, () => {
        void refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        void refresh();
      })
      .subscribe();

    const poll = setInterval(() => {
      void refresh();
      setTick((t) => t + 1);
    }, 2500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [deviceId, refresh]);

  const online = isOnline(device?.last_seen ?? null);
  const classification = !online ? "OFFLINE" : (reading?.classification ?? "NORMAL");

  return { reading, alerts, device, online, classification, loading, refresh, tick };
}

export async function acknowledgeAlert(id: string) {
  await fetch(`/api/public/alerts/${id}`, { method: "PATCH" });
}

export async function runScenario(scenario: string, deviceId = DEFAULT_DEVICE_ID) {
  const res = await fetch("/api/public/test/sensor-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario, deviceId }),
  });
  return res.json();
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
