-- Tighten public read access: only recent data is exposed to anonymous readers
DROP POLICY "readings are public" ON public.sensor_readings;
CREATE POLICY "recent readings are public"
  ON public.sensor_readings FOR SELECT
  TO anon, authenticated
  USING (timestamp > now() - interval '30 days');

DROP POLICY "alerts are public" ON public.alerts;
CREATE POLICY "recent alerts are public"
  ON public.alerts FOR SELECT
  TO anon, authenticated
  USING (timestamp > now() - interval '90 days');

-- Remove public write access: acknowledging alerts goes through the
-- server-side PATCH /api/public/alerts/:id route (service role), so no
-- anonymous UPDATE policy is needed.
DROP POLICY "alerts can be acknowledged" ON public.alerts;