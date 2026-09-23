import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/backend")({
  head: () => ({
    meta: [
      { title: "Backend API — VitalLume" },
      { name: "description", content: "Live view of VitalLume's server API endpoints, database and ESP32 ingestion." },
      { property: "og:title", content: "Backend API — VitalLume" },
      { property: "og:description", content: "Test VitalLume's live server endpoints backed by a Postgres database." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BackendPage,
});

type Ep = { method: string; path: string; desc: string; body?: unknown; file: string };
const ENDPOINTS: Ep[] = [
  { method: "GET", path: "/api/public/health", desc: "Server health check", file: "src/routes/api/public/health.ts" },
  { method: "GET", path: "/api/public/sensors/latest?deviceId=vitallume-001", desc: "Latest reading + classification", file: "src/routes/api/public/sensors/latest.ts" },
  { method: "GET", path: "/api/public/sensors/history?deviceId=vitallume-001&limit=5", desc: "Stored reading history", file: "src/routes/api/public/sensors/history.ts" },
  { method: "GET", path: "/api/public/device/status/vitallume-001", desc: "Device heartbeat online/offline", file: "src/routes/api/public/device/status.$deviceId.ts" },
  { method: "GET", path: "/api/public/alerts", desc: "List alerts from the database", file: "src/routes/api/public/alerts.ts" },
  { method: "POST", path: "/api/public/test/sensor-data", desc: "Inject a demo reading (runs evaluation engine)", body: { scenario: "normal" }, file: "src/routes/api/public/test/sensor-data.ts" },
  { method: "POST", path: "/api/public/device/data", desc: "ESP32 ingestion (no key → expect 401)", body: { deviceId: "vitallume-001", temperature: 22 }, file: "src/routes/api/public/device/data.ts" },
];

function BackendPage() {
  const [results, setResults] = useState<Record<string, { status: number; ms: number; body: string }>>({});

  async function call(ep: Ep) {
    const t = performance.now();
    const res = await fetch(ep.path, {
      method: ep.method,
      headers: ep.body ? { "Content-Type": "application/json" } : undefined,
      body: ep.body ? JSON.stringify(ep.body) : null,
    });
    const text = await res.text();
    const ms = Math.round(performance.now() - t);
    let data: unknown = text;
    try { data = JSON.parse(text); } catch { /* keep text */ }
    console.log(`%c[VitalLume backend] ${ep.method} ${ep.path} → ${res.status} (${ms}ms)`, "color:#16a34a;font-weight:bold", data);
    setResults((r) => ({ ...r, [ep.path]: { status: res.status, ms, body: JSON.stringify(data, null, 2) } }));
  }

  async function runAll() {
    console.log("%c[VitalLume backend] Running all server endpoints…", "color:#0d9488;font-weight:bold");
    for (const ep of ENDPOINTS) await call(ep);
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl font-extrabold">Backend API</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          VitalLume's backend runs on the server, not in the browser, so its code doesn't show up in your browser's developer tools.
          Every button below sends a real request to the server, which reads or writes the Postgres database.
          Open DevTools (F12) and check the <b>Console</b> and <b>Network</b> tabs to watch each request and reply.
        </p>
        <Button className="mt-6" onClick={runAll}>Run all endpoints</Button>
        <div className="mt-8 grid gap-4">
          {ENDPOINTS.map((ep) => {
            const r = results[ep.path];
            return (
              <div key={ep.path} className="card-soft p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="chip bg-secondary text-secondary-foreground">{ep.method}</span>
                  <code className="text-sm font-bold break-all">{ep.path}</code>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => call(ep)}>Try it</Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{ep.desc} · <code>{ep.file}</code></p>
                {r && (
                  <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-muted p-3 text-xs">
                    {`HTTP ${r.status} · ${r.ms}ms\n${r.body}`}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
