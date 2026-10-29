-- 20261010000001_memberships.sql

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and coaches can view all memberships." ON memberships 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')
        )
    );

CREATE POLICY "Members can view their own memberships." ON memberships 
    FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Only admins can modify memberships." ON memberships 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Sequence for membership numbers
CREATE SEQUENCE IF NOT EXISTS membership_number_seq START 1000;

-- Function to generate membership numbers
CREATE OR REPLACE FUNCTION public.generate_membership_number()
RETURNS text AS $$
DECLARE
    next_val integer;
    num_str text;
BEGIN
    SELECT nextval('membership_number_seq') INTO next_val;
    num_str := 'MEM-' || to_char(next_val, 'FM000000');
    RETURN num_str;
END;
$$ LANGUAGE plpgsql;
