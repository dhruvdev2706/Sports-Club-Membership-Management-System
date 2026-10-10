import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, Loader2, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Brand Panel - Left */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-primary text-primary-foreground flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Apex Sports</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Regain access.
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-sm">
            We will help you get back into your account securely so you can resume your activities.
          </p>
        </div>
        
        <div className="relative z-10 text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Apex Sports Club Management.
        </div>

        {/* Abstract decorative graphic */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Form Panel - Right */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[400px] space-y-8 my-auto">
          
          <div className="text-center md:text-left">
            <div className="md:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-md bg-accent text-accent-foreground flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">Apex Sports</span>
            </div>
            
            <Link to="/auth/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
            
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Reset password</h2>
            <p className="text-muted-foreground mt-2">
              {submitted ? "Check your email for a reset link." : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Sending link...' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg border border-border text-center">
              <p className="text-sm">We've sent a password reset link to <strong>{email}</strong>.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Try a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
