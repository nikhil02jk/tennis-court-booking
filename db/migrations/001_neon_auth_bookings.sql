CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text DEFAULT auth.user_id() NOT NULL,
  court_id text NOT NULL,
  court_name text NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  players integer NOT NULL DEFAULT 2 CHECK (players BETWEEN 1 AND 4),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN user_id SET DEFAULT auth.user_id(),
  ALTER COLUMN duration_minutes SET DEFAULT 60,
  ALTER COLUMN players SET DEFAULT 2,
  ALTER COLUMN status SET DEFAULT 'confirmed',
  ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS bookings_user_date_idx
  ON public.bookings (user_id, booking_date, start_time);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_idx
  ON public.bookings (court_id, booking_date, start_time)
  WHERE status = 'confirmed';

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookings_manage_own_rows ON public.bookings;

CREATE POLICY bookings_manage_own_rows ON public.bookings
FOR ALL TO authenticated
USING (auth.user_id() = user_id)
WITH CHECK (auth.user_id() = user_id);
