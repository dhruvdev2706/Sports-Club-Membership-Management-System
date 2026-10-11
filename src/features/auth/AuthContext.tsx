import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'coach' | 'member';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('playgrid_active_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getFallbackProfile = (u: User): UserProfile => ({
    id: u.id,
    email: u.email || '',
    full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Member',
    role: u.user_metadata?.role || 'member'
  });

  const fetchProfile = async (userId: string, currentUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        setProfile(data as UserProfile);
        try {
          localStorage.setItem('playgrid_active_profile', JSON.stringify(data));
        } catch {}
      } else if (currentUser) {
        const fallback = getFallbackProfile(currentUser);
        setProfile((prev) => prev || fallback);
      }
    } catch (error) {
      console.warn('Profile fetch note:', error);
      if (currentUser) {
        setProfile((prev) => prev || getFallbackProfile(currentUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fast-path: optimistic profile allows immediate layout rendering without delay
        const fallback = getFallbackProfile(session.user);
        setProfile((prev) => prev || fallback);
        setIsLoading(false);
        fetchProfile(session.user.id, session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const fallback = getFallbackProfile(session.user);
        setProfile((prev) => prev || fallback);
        setIsLoading(false);
        fetchProfile(session.user.id, session.user);
      } else {
        try {
          localStorage.removeItem('playgrid_active_profile');
        } catch {}
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem('playgrid_active_profile');
    } catch {}
    setProfile(null);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
