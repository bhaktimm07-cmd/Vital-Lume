# Vital-Lume

Build "VitalLume" — a privacy-preserving ambient home safety & health-monitoring web app that reads data from IoT sensors installed in a home (no wearables, no cameras — sensors live in a device).

=== DESIGN DIRECTION ===

Light, warm, friendly UI in the style of Duolingo: white/off-white backgrounds, soft rounded cards, playful but clean typography, a bright cheerful accent color (e.g. a warm teal, green, or coral — not neon, not dark navy, not the generic dark-mode-SaaS look). Approachable and human, appropriate for a home-safety product used by non-technical family members and caregivers, not a "hacker dashboard" aesthetic. Use gentle shadows, generous whitespace, and clear status colors (calm green = normal, amber = warning, red = critical) that stay legible on a light background.

=== BACKEND / DATA ===

Use Supabase (Postgres) as the only data store — no in-memory or temporary storage anywhere, since sensor data must persist and be readable by the dashboard in real time after every write. Use Supabase's realtime subscriptions (or frequent polling, ~2–3s) so the dashboard updates live the moment new sensor data arrives, with no manual refresh needed.

Tables:

- devices: id, deviceId (unique), name, status (ONLINE/OFFLINE), lastSeen, createdAt

- sensor_readings: id, deviceId, timestamp, temperature, humidity, pressure, gas, sound, motion (boolean), presence (boolean), rawPayload (jsonb), createdAt

  — DO NOT include respiration or any heart-rate/heartbeat field. These are not measured by the hardware and must not appear anywhere in the schema, API, or UI.

- alerts: id, deviceId, type, severity, message, sensor, value, threshold, acknowledged (boolean), acknowledgedAt, timestamp

API endpoints (as Supabase edge functions or equivalent):

- POST /device/data — authenticated ingestion endpoint for the ESP32/IoT hardware, secured with a device API key (Authorization: Bearer <key> or x-api-key header). Accepts deviceId, temperature, humidity, pressure, gas, sound, motion, presence. Rejects requests with an invalid/missing key (401).

- POST /sensors/data — general multi-sensor ingestion endpoint, runs the evaluation engine, writes to sensor_readings, creates alerts if thresholds are breached.

- GET /sensors/latest?deviceId=... — latest reading + current classification + device online state.

- GET /sensors/history?deviceId=...&limit=... — historical points for trend charts (time, temp, gas, activity, risk).

- GET /device/status/:deviceId — heartbeat check: online/offline based on time since lastSeen vs. a configurable offline-timeout.

- GET/POST /alerts, PATCH /alerts/:id — list, create, and acknowledge alerts.

- GET /health — simple health check.

- POST /test/sensor-data — injects demo scenarios (normal, warning_temp, warning_gas, critical_fall, device_offline) so the dashboard can be demoed without real hardware connected.

Evaluation engine: non-diagnostic, physics/threshold-based (not medical diagnosis). Combine temperature, humidity, gas, sound, and motion/presence to classify each reading as NORMAL / WARNING / CRITICAL, with a risk level, an activity-pattern label, and a confidence score. Thresholds should be configurable (temp cold/hot, humidity low/high, gas warning/critical, sound shock level, offline timeout).

=== FRONTEND PAGES ===

1. Landing page — explains the product ("the invisible home guardian"), how it works, privacy-first messaging (no cameras/wearables), in the Duolingo-style light theme.

2. Live Dashboard — the main screen. Show current sensor readings (temperature, humidity, gas, sound, motion/presence) as clear, presentable cards/tiles with simple icons and plain-language labels (e.g. "Air quality: Good" instead of raw gas ppm alone) — not charts or graphs. Show device status (ONLINE/OFFLINE) and the current NORMAL/WARNING/CRITICAL classification prominently, updating live as new data arrives from Supabase. No line/waveform/trend charts anywhere — readings should be understandable at a glance by a non-technical family member or caregiver, not require reading a graph.

3. Emergency/fall-detection simulator — a demo control that triggers the test-scenario endpoint so a fall or gas leak scenario can be simulated and watched propagate through the dashboard and alerts.

4. Alerts panel — list of active/past alerts with severity, plain-language explanation of what triggered it, and a way to acknowledge them.

5. Caregiver dispatch view — when a CRITICAL alert fires, show an incident trace / dispatch flow (who would be notified, what happened, when).

Do NOT include any respiration-rate or heartbeat/heart-rate UI element, chart, card, or metric anywhere in the app. Do NOT include trend charts, waveform graphs, or historical line charts anywhere — present sensor readings as clean, immediate, current-state cards instead.



=== IoT HARDWARE INTEGRATION ===

The physical device is an ESP32 with a BME680 (temp/humidity/gas), a sound sensor, and a PIR/mmWave motion sensor. It POSTs JSON readings periodically to the /device/data endpoint using a Bearer token / API key for auth. The web app must expose a stable, documented endpoint URL and auth mechanism the ESP32 firmware can be pointed at after deployment, and the dashboard must reflect real device data within a few seconds of it being posted — this real-hardware-to-live-dashboard path is the most important thing to get right.

=== DEPLOYMENT ===

Deploy via Lovable's built-in publish/hosting with Supabase connected as the backing database, so frontend, backend/API, and database are all live on one connected deployment with no separate hosting step required.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vital-lume.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0c4d5e90-a5ae-4870-bdee-ebe65d6d35b7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
