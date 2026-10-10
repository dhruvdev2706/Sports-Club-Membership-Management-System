import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { randomUUID } from 'crypto';

const router = Router();

// Record a manual/demo payment (Admin only)
router.post('/manual', requireAuth, requireRole(['admin']), async (req, res): Promise<void> => {
  const { member_id, amount, purpose } = req.body;

  try {
    const transaction_ref = `DEMO-${randomUUID().substring(0, 8).toUpperCase()}`;

    const { data, error } = await supabaseAdmin.from('payments').insert({
      transaction_ref,
      member_id,
      purpose,
      amount,
      method: 'Manual/Cash',
      status: 'success'
    }).select().single();

    if (error) throw error;
    res.json({ message: 'Payment recorded', payment: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PDF receipt generation (simulated endpoint)
router.get('/:id/receipt', async (req, res): Promise<void> => {
  // In a real implementation, you'd use something like PDFKit to generate a PDF buffer.
  // For now, we will return a JSON simulation to prove the route exists.
  res.json({ message: 'Receipt PDF generation would happen here.' });
});

export default router;
