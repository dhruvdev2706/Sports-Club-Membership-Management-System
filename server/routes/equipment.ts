import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Issue equipment
router.post('/issue', requireAuth, requireRole(['admin', 'coach']), async (req, res): Promise<void> => {
  const { equipment_id, member_id, quantity } = req.body;
  const issued_by = req.user.id;

  try {
    const { error, data } = await supabaseAdmin.rpc('issue_equipment', {
      p_equipment_id: equipment_id,
      p_member_id: member_id || null,
      p_issued_by: issued_by,
      p_quantity: quantity,
      p_expected_return_date: null,
      p_notes: 'Issued via portal'
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: 'Equipment issued', transaction_id: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Return equipment
router.post('/return', requireAuth, requireRole(['admin', 'coach']), async (req, res): Promise<void> => {
  const { transaction_id, condition } = req.body;

  try {
    const { error } = await supabaseAdmin.rpc('return_equipment', {
      p_transaction_id: transaction_id,
      p_condition: condition,
      p_notes: 'Returned via portal'
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: 'Equipment returned' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
