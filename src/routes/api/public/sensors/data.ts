import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { admin, extractApiKey, ingestReading, json, preflight } from "@/lib/ingest.server";

const schema = z.object({
  deviceId: z.string().min(1).max(64),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  pressure: z.number().optional(),
  gas: z.number().optional(),
  sound: z.number().optional(),
  motion: z.boolean().optional(),
  presence: z.boolean().optional(),
});

export const Route = createFileRoute("/api/public/sensors/data")({
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
        if (!parsed.success) {
          return json({ error: "Invalid payload", details: parsed.error.issues }, 400);
        }

        const key = extractApiKey(request);
        const db = await admin();
        const { data: device } = await db
          .from("devices")
          .select("device_id, api_key")
          .eq("device_id", parsed.data.deviceId)
          .maybeSingle();
        if (!device) return json({ error: "Unknown device" }, 404);
        if (!key || device.api_key !== key) return json({ error: "Invalid API key" }, 401);

        const { reading, evaluation } = await ingestReading(parsed.data);
        return json({ ok: true, reading, evaluation }, 201);
      },
    },
  },
});
