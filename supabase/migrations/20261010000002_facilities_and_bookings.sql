-- 20261010000002_facilities_and_bookings.sql

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
    description TEXT,
    location TEXT,
    capacity INTEGER DEFAULT 1,
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    booking_duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE facility_operating_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    UNIQUE (facility_id, day_of_week)
);

CREATE TABLE facility_blocked_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT
);

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(id) ON DELETE RESTRICT,
    member_id UUID REFERENCES members(id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status DEFAULT 'confirmed',
    fee DECIMAL(10,2) NOT NULL,
    admin_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    EXCLUDE USING gist (
        facility_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status = 'confirmed' OR status = 'pending')
);

-- RLS Policies
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sports viewable by all authenticated." ON sports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage sports." ON sports FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Facilities viewable by all authenticated." ON facilities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage facilities." ON facilities FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

ALTER TABLE facility_operating_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operating hours viewable by all authenticated." ON facility_operating_hours FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage operating hours." ON facility_operating_hours FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

ALTER TABLE facility_blocked_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blocked periods viewable by all authenticated." ON facility_blocked_periods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage blocked periods." ON facility_blocked_periods FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view own bookings." ON bookings FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Admins and coaches can view all bookings." ON bookings FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')));
CREATE POLICY "Members can insert their own bookings." ON bookings FOR INSERT WITH CHECK (member_id = auth.uid());
CREATE POLICY "Members can update own bookings (cancel)." ON bookings FOR UPDATE USING (member_id = auth.uid());
CREATE POLICY "Admins can manage all bookings." ON bookings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
