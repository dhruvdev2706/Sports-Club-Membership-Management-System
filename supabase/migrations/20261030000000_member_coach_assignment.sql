ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS coach_id UUID
REFERENCES public.coaches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS members_coach_id_idx
ON public.members(coach_id);