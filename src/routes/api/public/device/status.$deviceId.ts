import { createFileRoute } from "@tanstack/react-router";
import { json, markOfflineIfStale, preflight } from "@/lib/ingest.server";

export const Route = createFileRoute("/api/public/device/status/$deviceId")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ params }) => {
        const device = await markOfflineIfStale(params.deviceId);
        if (!device) return json({ error: "Unknown device" }, 404);
        return json(device);
      },
    },
  },
});
