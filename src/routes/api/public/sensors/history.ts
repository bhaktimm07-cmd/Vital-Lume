import { createFileRoute } from "@tanstack/react-router";
import { admin, json, preflight } from "@/lib/ingest.server";

export const Route = createFileRoute("/api/public/sensors/history")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const deviceId = url.searchParams.get("deviceId") ?? "vitallume-001";
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 500);
        const db = await admin();
        const { data, error } = await db
          .from("sensor_readings")
          .select("timestamp, temperature, humidity, gas, sound, motion, presence, classification, risk_level, activity_pattern")
          .eq("device_id", deviceId)
          .order("timestamp", { ascending: false })
          .limit(limit);
        if (error) return json({ error: error.message }, 500);
        return json({ deviceId, count: data?.length ?? 0, points: data ?? [] });
      },
    },
  },
});
