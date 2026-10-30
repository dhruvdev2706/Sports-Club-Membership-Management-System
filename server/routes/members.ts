import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Approves a membership plan for a member, assigning them a membership number
router.post('/:id/approve', requireAuth, requireRole(['admin']), async (req, res): Promise<void> => {
  const { id } = req.params;
  const { plan_id } = req.body;
  
  if (!plan_id) {
    res.status(400).json({ error: 'plan_id is required' });
    return;
  }

  try {
    // 1. Get the plan details
    const { data: plan, error: planError } = await supabaseAdmin.from('membership_plans').select('*').eq('id', plan_id).single();
    if (planError || !plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    // 2. Generate membership number via PostgreSQL function
    // Supabase JS RPC requires a function created in the database. 
    // We created `generate_membership_number` in the migration.
    let membershipNumber = null;
    
    // Check if member already has a number
    const { data: existingMember } = await supabaseAdmin.from('members').select('membership_number').eq('id', id).single();
    
    if (existingMember && existingMember.membership_number) {
      membershipNumber = existingMember.membership_number;
    } else {
      const { data: numData, error: rpcError } = await supabaseAdmin.rpc('generate_membership_number');
      if (rpcError) throw rpcError;
      membershipNumber = numData;
    }

    // 3. Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    // 4. Update the member record
    const { error: memberError } = await supabaseAdmin
      .from('members')
      .update({
        status: 'active',
        membership_number: membershipNumber,
        current_plan_id: plan.id,
        plan_start_date: startDate.toISOString().split('T')[0],
        plan_expiry_date: endDate.toISOString().split('T')[0]
      })
      .eq('id', id);
      
    if (memberError) throw memberError;

    // 5. Insert into memberships history
    const { error: historyError } = await supabaseAdmin
      .from('memberships')
      .insert({
        member_id: id,
        plan_id: plan.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active'
      });
      
    if (historyError) throw historyError;

    res.json({ message: 'Member approved successfully', membership_number: membershipNumber });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update member status manually (suspend, cancel)
router.patch('/:id/status', requireAuth, requireRole(['admin']), async (req, res): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body; // 'suspended', 'cancelled', etc.
  
  try {
    const { error } = await supabaseAdmin.from('members').update({ status }).eq('id', id);
    if (error) throw error;
    
    if (status === 'cancelled') {
      await supabaseAdmin.from('memberships').update({ status: 'cancelled' }).eq('member_id', id).eq('status', 'active');
    }
    
    res.json({ message: `Member status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
