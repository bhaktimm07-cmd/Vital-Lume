import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { admin, ingestReading, json, preflight } from "@/lib/ingest.server";
import type { IngestPayload } from "@/lib/ingest.server";

const schema = z.object({
  scenario: z.enum(["normal", "warning_temp", "warning_gas", "critical_fall", "device_offline"]),
  deviceId: z.string().min(1).default("vitallume-001"),
});

const scenarios: Record<string, Omit<IngestPayload, "deviceId">> = {
  normal: { temperature: 22.4, humidity: 46, pressure: 1012, gas: 60, sound: 38, motion: true, presence: true },
  warning_temp: { temperature: 34.5, humidity: 52, pressure: 1009, gas: 80, sound: 41, motion: true, presence: true },
  warning_gas: { temperature: 23.1, humidity: 48, pressure: 1011, gas: 235, sound: 44, motion: true, presence: true },
  critical_fall: { temperature: 22.8, humidity: 47, pressure: 1010, gas: 70, sound: 96, motion: false, presence: true },
};

export const Route = createFileRoute("/api/public/test/sensor-data")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) return json({ error: "Invalid scenario" }, 400);
        const { scenario, deviceId } = parsed.data;

        if (scenario === "device_offline") {
          const db = await admin();
          await db
            .from("devices")
            .update({ status: "OFFLINE", last_seen: new Date(Date.now() - 10 * 60_000).toISOString() })
            .eq("device_id", deviceId);
          return json({ ok: true, scenario });
        }

        const result = await ingestReading({ deviceId, ...scenarios[scenario]! });
        return json({ ok: true, scenario, ...result }, 201);
      },
    },
  },
});
