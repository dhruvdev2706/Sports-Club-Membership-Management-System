import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2,
  CalendarDays
} from 'lucide-react';

export default function TournamentsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', venue: '', description: '', start_date: '', end_date: '', registration_deadline: '', entry_fee: 0, capacity: 32
  });

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tournaments').select('*').order('start_date', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const { data: myRegistrations } = useQuery({
    queryKey: ['my_registrations', profile?.id],
    queryFn: async () => {
      if (isAdmin) return [];
      const { data, error } = await supabase.from('tournament_registrations').select('tournament_id, status').eq('member_id', profile?.id);
      if (error) throw error;
      return data;
    },
    enabled: !isAdmin
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tournaments').insert(formData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tournament created successfully');
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setIsFormOpen(false);
      setFormData({ name: '', venue: '', description: '', start_date: '', end_date: '', registration_deadline: '', entry_fee: 0, capacity: 32 });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const registerMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      // In a real app, this should go through the server to securely check capacity constraints and generate an audit log.
      const { error } = await supabase.from('tournament_registrations').insert({
        tournament_id: tournamentId,
        member_id: profile?.id
      });
      if (error) {
        if (error.code === '23505') throw new Error('Already registered');
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Registered successfully');
      queryClient.invalidateQueries({ queryKey: ['my_registrations'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" /> Tournaments
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Manage club tournaments, events, and registrations.' : 'Discover and register for upcoming club tournaments.'}
          </p>
        </div>
        {isAdmin && !isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Tournament
          </button>
        )}
      </div>

      {isFormOpen && isAdmin && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> New Tournament
            </h2>
            <button onClick={() => setIsFormOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Tournament Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Annual Summer Championship"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" /> Venue
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., Main Center Courts"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                  value={formData.venue} 
                  onChange={e => setFormData({...formData, venue: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" /> Start Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                  value={formData.start_date} 
                  onChange={e => setFormData({...formData, start_date: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" /> End Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                  value={formData.end_date} 
                  onChange={e => setFormData({...formData, end_date: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" /> Reg. Deadline
                </label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                  value={formData.registration_deadline} 
                  onChange={e => setFormData({...formData, registration_deadline: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" /> Entry Fee ($)
                </label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                  value={formData.entry_fee} 
                  onChange={e => setFormData({...formData, entry_fee: Number(e.target.value)})} 
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-border flex justify-end gap-3">
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => createMutation.mutate()} 
                disabled={createMutation.isPending || !formData.name || !formData.start_date || !formData.registration_deadline} 
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {createMutation.isPending ? 'Saving...' : 'Save Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p>Loading tournaments...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments?.map((t: any) => {
            const isRegistered = myRegistrations?.some((r: any) => r.tournament_id === t.id);
            const isPastDeadline = new Date(t.registration_deadline) < new Date();
            
            return (
              <div key={t.id} className="group relative flex flex-col p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-xl text-foreground line-clamp-2 pr-4">{t.name}</h3>
                  <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                    ${t.status === 'open' ? 'bg-success/10 text-success border border-success/20' : 
                      t.status === 'completed' ? 'bg-muted text-muted-foreground border border-border' : 
                      'bg-warning/10 text-warning border border-warning/20'}`}>
                    {t.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <MapPin className="w-4 h-4" /> {t.venue || 'TBA'}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex flex-col p-3 bg-muted/40 rounded-lg border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Start Date
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {new Date(t.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-col p-3 bg-muted/40 rounded-lg border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Entry Fee
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {t.entry_fee > 0 ? `$${t.entry_fee}` : 'Free'}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                    <span className="text-xs font-medium text-destructive/80 mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Registration Deadline
                    </span>
                    <span className={`text-sm font-semibold ${isPastDeadline ? 'text-destructive line-through opacity-70' : 'text-foreground'}`}>
                      {new Date(t.registration_deadline).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                
                {!isAdmin && (
                  <div className="mt-auto pt-2">
                    {isRegistered ? (
                      <div className="w-full flex items-center justify-center gap-2 py-3 bg-success/10 text-success border border-success/20 rounded-lg font-medium text-sm transition-colors cursor-default">
                        <CheckCircle2 className="w-5 h-5" /> Registered
                      </div>
                    ) : isPastDeadline || t.status !== 'open' ? (
                      <div className="w-full flex items-center justify-center gap-2 py-3 bg-muted/50 text-muted-foreground border border-border rounded-lg font-medium text-sm transition-colors cursor-not-allowed">
                        <X className="w-4 h-4" /> Registration Closed
                      </div>
                    ) : (
                      <button 
                        onClick={() => registerMutation.mutate(t.id)}
                        disabled={registerMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                      >
                        {registerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {registerMutation.isPending ? 'Registering...' : 'Register Now'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {tournaments?.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-border rounded-xl bg-muted/10">
              <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No upcoming tournaments</h3>
              <p className="text-muted-foreground mb-4">There are currently no tournaments scheduled.</p>
              {isAdmin && (
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Tournament
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
