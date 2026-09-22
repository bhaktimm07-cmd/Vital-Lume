import { createFileRoute } from "@tanstack/react-router";
import { admin, json, markOfflineIfStale, preflight } from "@/lib/ingest.server";

export const Route = createFileRoute("/api/public/sensors/latest")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const deviceId = new URL(request.url).searchParams.get("deviceId") ?? "vitallume-001";
        const db = await admin();
        const { data: reading } = await db
          .from("sensor_readings")
          .select("*")
          .eq("device_id", deviceId)
          .order("timestamp", { ascending: false })
          .limit(1)
          .maybeSingle();
        const device = await markOfflineIfStale(deviceId);
        return json({
          device,
          reading,
          classification: reading?.classification ?? "NORMAL",
          riskLevel: reading?.risk_level ?? "LOW",
          activityPattern: reading?.activity_pattern ?? "UNKNOWN",
          confidence: reading?.confidence ?? 0,
        });
      },
    },
  },
});
