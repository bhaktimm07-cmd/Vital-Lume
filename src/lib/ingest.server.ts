import { DEFAULT_THRESHOLDS, evaluateReading, type Reading } from "./evaluation";

export const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders });

export const preflight = () => new Response(null, { status: 204, headers: jsonHeaders });

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function extractApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return request.headers.get("x-api-key");
}

export type IngestPayload = Reading & { deviceId: string; name?: string };

export async function ingestReading(payload: IngestPayload) {
  const db = await admin();
  const evaluation = evaluateReading(payload, DEFAULT_THRESHOLDS);
  const now = new Date().toISOString();

  await db
    .from("devices")
    .update({ status: "ONLINE", last_seen: now })
    .eq("device_id", payload.deviceId);

  const { data: reading, error } = await db
    .from("sensor_readings")
    .insert({
      device_id: payload.deviceId,
      timestamp: now,
      temperature: payload.temperature ?? null,
      humidity: payload.humidity ?? null,
      pressure: payload.pressure ?? null,
      gas: payload.gas ?? null,
      sound: payload.sound ?? null,
      motion: !!payload.motion,
      presence: !!payload.presence,
      classification: evaluation.classification,
      risk_level: evaluation.riskLevel,
      activity_pattern: evaluation.activityPattern,
      confidence: evaluation.confidence,
      raw_payload: payload as unknown as Record<string, unknown>,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (evaluation.findings.length > 0) {
    await db.from("alerts").insert(
      evaluation.findings.map((f) => ({
        device_id: payload.deviceId,
        type: f.type,
        severity: f.severity,
        message: f.message,
        sensor: f.sensor,
        value: f.value,
        threshold: f.threshold,
        timestamp: now,
      })),
    );
  }

  return { reading, evaluation };
}

export async function markOfflineIfStale(deviceId: string) {
  const db = await admin();
  const { data } = await db
    .from("devices")
    .select("device_id, name, status, last_seen, created_at")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (!data) return null;
  const stale =
    !data.last_seen ||
    Date.now() - new Date(data.last_seen).getTime() >
      DEFAULT_THRESHOLDS.offlineTimeoutSeconds * 1000;
  const status = stale ? "OFFLINE" : "ONLINE";
  if (status !== data.status) {
    await db.from("devices").update({ status }).eq("device_id", deviceId);
  }
  return { ...data, status, offlineTimeoutSeconds: DEFAULT_THRESHOLDS.offlineTimeoutSeconds };
}
