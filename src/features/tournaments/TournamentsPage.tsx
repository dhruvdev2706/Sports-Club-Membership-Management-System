import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plus, 
  Users 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';

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
      const { error } = await supabase.from('tournament_registrations').insert({
        tournament_id: tournamentId,
        member_id: profile?.id
      });
      if (error) {
        if (error.code === '23505') throw new Error('Already registered for this tournament');
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Registration confirmed! Good luck in the competition.');
      queryClient.invalidateQueries({ queryKey: ['my_registrations'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const nowEpoch = useMemo(() => Date.now(), []);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Club Tournaments & Events" 
        description="Compete in club championships, inter-club tournaments, and track official leaderboards."
        actions={
          isAdmin && (
            <Button 
              variant="primary"
              onClick={() => setIsFormOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Host Tournament
            </Button>
          )
        }
      />

      {/* Tournaments Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#A6A6AC]">
          <div className="w-9 h-9 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading tournament schedules...</p>
        </div>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t: any) => {
            const isRegistered = myRegistrations?.some((r: any) => r.tournament_id === t.id);
            const isPastDeadline = t.registration_deadline ? new Date(t.registration_deadline).getTime() < nowEpoch : false;

            return (
              <div 
                key={t.id} 
                className="bg-[#121212] rounded-[26px] border border-[#242424] hover:border-[#383838] p-7 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF4B16]/15 border border-[#FF4B16]/30 flex items-center justify-center text-[#FF4B16] shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    {isRegistered ? (
                      <Badge variant="green">Registered</Badge>
                    ) : isPastDeadline ? (
                      <Badge variant="neutral">Closed</Badge>
                    ) : (
                      <Badge variant="orange">Open Registration</Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-extrabold text-[#F5F5F5] tracking-tight mb-2">
                    {t.name}
                  </h3>

                  <p className="text-xs text-[#A6A6AC] leading-relaxed line-clamp-2 mb-6">
                    {t.description || 'Official club sanctioned tournament. All verified members in good standing eligible.'}
                  </p>

                  <div className="space-y-2.5 p-4 rounded-2xl bg-[#181818] border border-[#262626] mb-6">
                    <div className="flex items-center justify-between text-xs text-[#A6A6AC]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#FF4B16]" /> Venue
                      </span>
                      <span className="text-[#F5F5F5] font-semibold">{t.venue || 'Club Main Center'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#A6A6AC]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#5035E8]" /> Date
                      </span>
                      <span className="text-[#F5F5F5] font-semibold">
                        {new Date(t.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#A6A6AC]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <DollarSign className="w-3.5 h-3.5 text-[#079C68]" /> Entry Fee
                      </span>
                      <span className="text-[#F5F5F5] font-bold">
                        {t.entry_fee > 0 ? `$${t.entry_fee}` : 'Free Entry'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#A6A6AC]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-[#A6A6AC]" /> Capacity
                      </span>
                      <span className="text-[#F5F5F5] font-mono font-bold">
                        {t.capacity || 32} Max Athletes
                      </span>
                    </div>
                  </div>
                </div>

                {!isAdmin && (
                  <Button
                    variant={isRegistered ? 'secondary' : isPastDeadline ? 'outline' : 'primary'}
                    className="w-full"
                    disabled={isRegistered || isPastDeadline || registerMutation.isPending}
                    isLoading={registerMutation.isPending}
                    onClick={() => registerMutation.mutate(t.id)}
                  >
                    {isRegistered ? 'Confirmed Participant' : isPastDeadline ? 'Registration Ended' : 'Register for Tournament'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          icon={<Trophy className="w-8 h-8" />}
          title="No Active Tournaments"
          description="Club tournaments and seasonal championships will be announced here."
          action={
            isAdmin && (
              <Button 
                variant="primary"
                onClick={() => setIsFormOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Create Tournament
              </Button>
            )
          }
        />
      )}

      {/* Host Tournament Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Host New Club Tournament"
        description="Set up tournament details, venue, entry fee, and registration cutoff."
        maxWidth="lg"
      >
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }} 
          className="space-y-4 pt-2"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Tournament Title *</label>
            <input 
              required
              type="text" 
              placeholder="e.g. playgrid Annual Summer Open"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Venue Location *</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Center Court Arena"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Athlete Capacity</label>
              <input 
                type="number" 
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Start Date *</label>
              <input 
                required
                type="date" 
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">End Date *</label>
              <input 
                required
                type="date" 
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Entry Fee ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Registration Deadline *</label>
            <input 
              required
              type="date" 
              value={formData.registration_deadline}
              onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
              className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Description & Rules</label>
            <textarea 
              rows={3}
              placeholder="Tournament format, eligibility, seed brackets, prizes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1E1E1E]">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              type="submit"
              isLoading={createMutation.isPending}
            >
              Publish Tournament
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
