import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { admin, json, preflight } from "@/lib/ingest.server";

const createSchema = z.object({
  deviceId: z.string().min(1),
  type: z.string().min(1),
  severity: z.enum(["WARNING", "CRITICAL"]),
  message: z.string().min(1).max(500),
  sensor: z.string().optional(),
  value: z.number().optional(),
  threshold: z.number().optional(),
});

export const Route = createFileRoute("/api/public/alerts")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const deviceId = url.searchParams.get("deviceId");
        const db = await admin();
        let query = db.from("alerts").select("*").order("timestamp", { ascending: false }).limit(100);
        if (deviceId) query = query.eq("device_id", deviceId);
        const { data, error } = await query;
        if (error) return json({ error: error.message }, 500);
        return json({ alerts: data ?? [] });
      },
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) return json({ error: "Invalid payload" }, 400);
        const db = await admin();
        const { data, error } = await db
          .from("alerts")
          .insert({
            device_id: parsed.data.deviceId,
            type: parsed.data.type,
            severity: parsed.data.severity,
            message: parsed.data.message,
            sensor: parsed.data.sensor ?? null,
            value: parsed.data.value ?? null,
            threshold: parsed.data.threshold ?? null,
          })
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ alert: data }, 201);
      },
    },
  },
});
