import { createFileRoute } from "@tanstack/react-router";
import { admin, json, preflight } from "@/lib/ingest.server";

export const Route = createFileRoute("/api/public/alerts/$id")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      PATCH: async ({ params }) => {
        const db = await admin();
        const { data, error } = await db
          .from("alerts")
          .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
          .eq("id", params.id)
          .select()
          .maybeSingle();
        if (error) return json({ error: error.message }, 500);
        if (!data) return json({ error: "Alert not found" }, 404);
        return json({ alert: data });
      },
    },
  },
});
