import { createFileRoute } from "@tanstack/react-router";
import { json, preflight } from "@/lib/ingest.server";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => json({ status: "ok", service: "VitalLume", time: new Date().toISOString() }),
    },
  },
});
