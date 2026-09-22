DROP VIEW IF EXISTS public.devices_public;
CREATE VIEW public.devices_public AS
SELECT id, device_id, name, status, last_seen, created_at FROM public.devices;
REVOKE SELECT ON public.devices FROM anon, authenticated;
GRANT SELECT ON public.devices_public TO anon, authenticated;
