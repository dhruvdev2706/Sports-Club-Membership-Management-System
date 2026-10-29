import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabase';

const router = Router();

// Secure first-admin provisioning procedure
// Requires a secret key passed in the headers to prevent unauthorized access
router.post('/setup-admin', async (req, res) => {
  const setupSecret = req.headers['x-setup-secret'];
  const expectedSecret = process.env.ADMIN_SETUP_SECRET;

  if (!expectedSecret || setupSecret !== expectedSecret) {
    return res.status(403).json({ error: 'Invalid or missing setup secret' });
  }

  const { email, password, fullName } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // 1. Create the user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'System Admin',
        role: 'admin'
      }
    });

    if (authError) throw authError;

    // Trigger should automatically create the profile, but let's ensure they have the admin role
    // if the trigger fell back to member for some reason.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id);

    if (profileError) throw profileError;

    res.json({ message: 'Admin provisioned successfully', user: authData.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
