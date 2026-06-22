DROP POLICY IF EXISTS bookings_manage_own_rows ON public.bookings;

ALTER TABLE IF EXISTS public.bookings
  ALTER COLUMN user_id DROP DEFAULT;

DROP FUNCTION IF EXISTS auth.user_id();
DROP SCHEMA IF EXISTS auth;
