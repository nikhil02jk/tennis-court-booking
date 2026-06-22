CREATE TABLE IF NOT EXISTS public.court_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text DEFAULT auth.user_id() NOT NULL,
  court_id text NOT NULL,
  court_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(trim(comment)) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.court_reviews
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN user_id SET DEFAULT auth.user_id(),
  ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS court_reviews_court_created_idx
  ON public.court_reviews (court_id, created_at DESC);

CREATE INDEX IF NOT EXISTS court_reviews_user_idx
  ON public.court_reviews (user_id);

ALTER TABLE public.court_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_reviews_read_all_authenticated ON public.court_reviews;
DROP POLICY IF EXISTS court_reviews_insert_own_rows ON public.court_reviews;
DROP POLICY IF EXISTS court_reviews_update_own_rows ON public.court_reviews;
DROP POLICY IF EXISTS court_reviews_delete_own_rows ON public.court_reviews;

CREATE POLICY court_reviews_read_all_authenticated ON public.court_reviews
FOR SELECT TO authenticated
USING (true);

CREATE POLICY court_reviews_insert_own_rows ON public.court_reviews
FOR INSERT TO authenticated
WITH CHECK (auth.user_id() = user_id);

CREATE POLICY court_reviews_update_own_rows ON public.court_reviews
FOR UPDATE TO authenticated
USING (auth.user_id() = user_id)
WITH CHECK (auth.user_id() = user_id);

CREATE POLICY court_reviews_delete_own_rows ON public.court_reviews
FOR DELETE TO authenticated
USING (auth.user_id() = user_id);
