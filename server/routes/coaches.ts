import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole(['admin']), async (req, res): Promise<void> => {
  const fullName = typeof req.body.full_name === 'string' ? req.body.full_name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!fullName || !email || !password) {
    res.status(400).json({ error: 'Full name, email, and initial password are required' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Enter a valid email address' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Initial password must be at least 8 characters' });
    return;
  }

  let createdUserId: string | undefined;

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (authError) throw authError;
    createdUserId = authData.user.id;

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: createdUserId,
      email,
      full_name: fullName,
      role: 'coach',
    }, { onConflict: 'id' });
    if (profileError) throw profileError;

    const { error: memberError } = await supabaseAdmin
      .from('members')
      .delete()
      .eq('id', createdUserId);
    if (memberError) throw memberError;

    const { data: coach, error: coachError } = await supabaseAdmin
      .from('coaches')
      .insert({
        id: createdUserId,
        specialization: req.body.specialization?.trim() || null,
        bio: req.body.bio?.trim() || null,
        phone: req.body.phone?.trim() || null,
      })
      .select('id, specialization, bio, phone')
      .single();
    if (coachError) throw coachError;

    res.status(201).json({ coach: { ...coach, full_name: fullName, email } });
  } catch (error) {
    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }
    const message = error instanceof Error ? error.message : 'Unable to create coach';
    res.status(400).json({ error: message });
  }
});

export default router;