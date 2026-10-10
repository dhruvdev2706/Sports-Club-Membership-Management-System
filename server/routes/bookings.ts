import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Create a booking
router.post('/', requireAuth, async (req, res): Promise<void> => {
  const { facility_id, start_time, end_time } = req.body;
  const member_id = req.user.id;

  try {
    // Validate member eligibility (active status)
    const { data: member } = await supabaseAdmin.from('members').select('status').eq('id', member_id).single();
    if (!member || member.status !== 'active') {
      res.status(403).json({ error: 'Only active members can book facilities' });
      return;
    }

    // Validate facility and calculate fee securely
    const { data: facility } = await supabaseAdmin.from('facilities').select('*').eq('id', facility_id).single();
    if (!facility || !facility.is_active) {
      res.status(400).json({ error: 'Facility is unavailable' });
      return;
    }

    const startTime = new Date(start_time);
    const endTime = new Date(end_time);
    
    if (startTime < new Date()) {
      res.status(400).json({ error: 'Cannot book in the past' });
      return;
    }
    
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const fee = durationHours * Number(facility.hourly_rate);

    // Insert booking (PostgreSQL exclusion constraint will reject overlaps automatically)
    const { data: booking, error } = await supabaseAdmin.from('bookings').insert({
      facility_id,
      member_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      fee,
      status: 'confirmed' // Assuming auto-confirm for now
    }).select().single();

    if (error) {
      if (error.code === '23P01') { // exclusion_violation
        res.status(409).json({ error: 'This time slot is already booked.' });
        return;
      }
      throw error;
    }

    res.json({ message: 'Booking confirmed', booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin cancel/modify booking
router.patch('/:id/status', requireAuth, requireRole(['admin']), async (req, res): Promise<void> => {
  const { id } = req.params;
  const { status, admin_reason } = req.body;

  try {
    const { error } = await supabaseAdmin.from('bookings').update({ status, admin_reason }).eq('id', id);
    if (error) throw error;
    res.json({ message: `Booking status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
