import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { admin, extractApiKey, ingestReading, json, preflight } from "@/lib/ingest.server";

const schema = z.object({
  deviceId: z.string().min(1).max(64),
  temperature: z.number().min(-60).max(150).optional(),
  humidity: z.number().min(0).max(100).optional(),
  pressure: z.number().min(0).max(2000).optional(),
  gas: z.number().min(0).max(100000).optional(),
  sound: z.number().min(0).max(200).optional(),
  motion: z.boolean().optional(),
  presence: z.boolean().optional(),
});

export const Route = createFileRoute("/api/public/device/data")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const key = extractApiKey(request);
        if (!key) return json({ error: "Missing API key" }, 401);

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

        const db = await admin();
        const { data: device } = await db
          .from("devices")
          .select("device_id, api_key")
          .eq("device_id", parsed.data.deviceId)
          .maybeSingle();

        if (!device || device.api_key !== key) {
          return json({ error: "Invalid API key for this device" }, 401);
        }

        const { reading, evaluation } = await ingestReading(parsed.data);
        return json({ ok: true, reading, evaluation }, 201);
      },
    },
  },
});
