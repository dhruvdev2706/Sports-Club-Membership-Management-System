-- 20261010000004_batches_and_attendance.sql

CREATE TABLE training_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
    coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    capacity INTEGER NOT NULL DEFAULT 10,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE batch_members (
    batch_id UUID REFERENCES training_batches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (batch_id, member_id)
);

CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES training_batches(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    notes TEXT,
    UNIQUE (session_id, member_id)
);

CREATE TABLE performance_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
    evaluation_date DATE NOT NULL,
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    metrics JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE training_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View batches" ON training_batches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage batches" ON training_batches FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

ALTER TABLE batch_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View batch members" ON batch_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage batch members" ON batch_members FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View training sessions" ON training_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage training sessions" ON training_sessions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')));

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View attendance" ON attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage attendance" ON attendance FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')));

ALTER TABLE performance_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view own evals" ON performance_evaluations FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Admins and coaches view all evals" ON performance_evaluations FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')));
CREATE POLICY "Coaches manage evals" ON performance_evaluations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')));
