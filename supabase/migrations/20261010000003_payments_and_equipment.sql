-- 20261010000003_payments_and_equipment.sql

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref TEXT UNIQUE NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    related_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    identifier TEXT UNIQUE,
    purchase_date DATE,
    total_quantity INTEGER NOT NULL DEFAULT 1,
    available_quantity INTEGER NOT NULL DEFAULT 1,
    condition TEXT DEFAULT 'good',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE equipment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expected_return_date TIMESTAMP WITH TIME ZONE,
    actual_return_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'issued',
    condition_at_issue TEXT,
    condition_at_return TEXT,
    notes TEXT
);

CREATE OR REPLACE FUNCTION issue_equipment(
    p_equipment_id UUID,
    p_member_id UUID,
    p_issued_by UUID,
    p_quantity INTEGER,
    p_expected_return_date TIMESTAMP WITH TIME ZONE,
    p_notes TEXT
) RETURNS UUID AS $$
DECLARE
    v_available INTEGER;
    v_transaction_id UUID;
BEGIN
    SELECT available_quantity INTO v_available FROM equipment WHERE id = p_equipment_id FOR UPDATE;
    
    IF v_available < p_quantity THEN
        RAISE EXCEPTION 'Insufficient equipment available.';
    END IF;
    
    UPDATE equipment SET available_quantity = available_quantity - p_quantity WHERE id = p_equipment_id;
    
    INSERT INTO equipment_transactions(equipment_id, member_id, issued_by, quantity, expected_return_date, condition_at_issue, notes)
    VALUES (p_equipment_id, p_member_id, p_issued_by, p_quantity, p_expected_return_date, 'good', p_notes)
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION return_equipment(
    p_transaction_id UUID,
    p_condition TEXT,
    p_notes TEXT
) RETURNS VOID AS $$
DECLARE
    v_transaction RECORD;
BEGIN
    SELECT * INTO v_transaction FROM equipment_transactions WHERE id = p_transaction_id FOR UPDATE;
    
    IF v_transaction.status != 'issued' THEN
        RAISE EXCEPTION 'Transaction is not in issued status.';
    END IF;
    
    UPDATE equipment SET available_quantity = available_quantity + v_transaction.quantity WHERE id = v_transaction.equipment_id;
    
    UPDATE equipment_transactions 
    SET status = 'returned', actual_return_date = timezone('utc'::text, now()), condition_at_return = p_condition, notes = p_notes 
    WHERE id = p_transaction_id;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view own payments" ON payments FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Admins view all payments" ON payments FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins manage payments" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view equipment" ON equipment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Coaches and Admins manage equipment" ON equipment FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')));

ALTER TABLE equipment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view equipment transactions" ON equipment_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Coaches and Admins manage equipment transactions" ON equipment_transactions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coach')));
