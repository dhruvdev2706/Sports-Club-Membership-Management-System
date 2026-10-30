import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabase.js';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      profile?: any;
    }
  }
}

export interface AuthRequest extends Request {
  user?: any;
  profile?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = user;
    req.profile = profile;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
};
