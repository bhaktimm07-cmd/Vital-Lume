-- Devices
CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'VitalLume Sensor',
  status text NOT NULL DEFAULT 'OFFLINE',
  api_key text NOT NULL,
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  temperature double precision,
  humidity double precision,
  pressure double precision,
  gas double precision,
  sound double precision,
  motion boolean NOT NULL DEFAULT false,
  presence boolean NOT NULL DEFAULT false,
  classification text NOT NULL DEFAULT 'NORMAL',
  risk_level text NOT NULL DEFAULT 'LOW',
  activity_pattern text NOT NULL DEFAULT 'UNKNOWN',
  confidence double precision NOT NULL DEFAULT 0,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sensor_readings_device_time_idx ON public.sensor_readings (device_id, timestamp DESC);

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  type text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  sensor text,
  value double precision,
  threshold double precision,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  timestamp timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alerts_device_time_idx ON public.alerts (device_id, timestamp DESC);

-- Safe public view of devices (hides api_key)
CREATE VIEW public.devices_public
WITH (security_invoker = true) AS
SELECT id, device_id, name, status, last_seen, created_at FROM public.devices;

GRANT ALL ON public.devices TO service_role;
GRANT ALL ON public.sensor_readings TO service_role;
GRANT ALL ON public.alerts TO service_role;
GRANT SELECT ON public.devices_public TO anon, authenticated;
GRANT SELECT ON public.devices TO anon, authenticated;
GRANT SELECT ON public.sensor_readings TO anon, authenticated;
GRANT SELECT, UPDATE ON public.alerts TO anon, authenticated;

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Demo app: readings and alerts are publicly readable; writes only via service role
CREATE POLICY "readings are public" ON public.sensor_readings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "alerts are public" ON public.alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "alerts can be acknowledged" ON public.alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
-- No SELECT policy on devices for anon: api_key stays hidden; devices_public is used instead

ALTER TABLE public.sensor_readings REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

INSERT INTO public.devices (device_id, name, status, api_key)
VALUES ('vitallume-001', 'Living Room Guardian', 'OFFLINE', 'vl_live_8f2a6c41d93b47e0a5c7b9d2e6f10a83');
