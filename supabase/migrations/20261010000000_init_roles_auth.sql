-- 20261010000000_init_roles_auth.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Enums
CREATE TYPE app_role AS ENUM ('admin', 'coach', 'member');
CREATE TYPE member_status AS ENUM ('pending', 'active', 'expired', 'suspended', 'cancelled');

-- Create Profiles Table (1:1 with auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies for profiles
CREATE POLICY "Public profiles are viewable by authenticated users." ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile." ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create Membership Plans Table
CREATE TABLE membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    fee DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on membership_plans
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membership plans are viewable by all authenticated users." ON membership_plans
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify membership plans." ON membership_plans
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create Members Table
CREATE TABLE members (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    membership_number TEXT UNIQUE,
    date_of_birth DATE,
    phone TEXT,
    status member_status DEFAULT 'pending',
    current_plan_id UUID REFERENCES membership_plans(id),
    plan_start_date DATE,
    plan_expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and coaches can view all members." ON members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')
        )
    );

CREATE POLICY "Members can view their own data." ON members
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Only admins can update members." ON members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create Coaches Table
CREATE TABLE coaches (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    specialization TEXT,
    bio TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on coaches
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches are viewable by all authenticated users." ON coaches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Coaches can update their own data." ON coaches
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Only admins can insert/delete coaches." ON coaches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name',
        COALESCE((new.raw_user_meta_data->>'role')::app_role, 'member')
    );
    
    -- If they registered as a member, we can initialize a member row
    IF COALESCE((new.raw_user_meta_data->>'role')::app_role, 'member') = 'member' THEN
        INSERT INTO public.members (id) VALUES (new.id);
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
