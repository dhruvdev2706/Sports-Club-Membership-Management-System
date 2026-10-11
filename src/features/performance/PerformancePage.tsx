import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  Save 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function PerformancePage() {
  const { profile } = useAuth();
  const isAdminOrCoach = profile?.role === 'admin' || profile?.role === 'coach';
  const queryClient = useQueryClient();
  
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [score, setScore] = useState<number>(75);
  const [notes, setNotes] = useState('');

  const { data: members } = useQuery({
    queryKey: ['performance_members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('members').select('id, profiles(full_name)').eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: isAdminOrCoach
  });

  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evaluations', isAdminOrCoach ? selectedMemberId : profile?.id],
    queryFn: async () => {
      let query = supabase.from('performance_evaluations').select('*, members(profiles(full_name)), coach:coach_id(full_name)').order('evaluation_date', { ascending: false });
      
      if (!isAdminOrCoach) {
        query = query.eq('member_id', profile?.id);
      } else if (selectedMemberId) {
        query = query.eq('member_id', selectedMemberId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const addEvalMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('performance_evaluations').insert({
        member_id: selectedMemberId,
        coach_id: profile?.id,
        evaluation_date: new Date().toISOString().split('T')[0],
        score,
        notes
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Performance evaluation recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      setScore(75);
      setNotes('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const getScoreTier = (s: number) => {
    if (s >= 85) return { label: 'Elite Mastery', badge: 'green' as const, color: '#079C68' };
    if (s >= 65) return { label: 'Advanced', badge: 'purple' as const, color: '#5035E8' };
    if (s >= 45) return { label: 'Intermediate', badge: 'orange' as const, color: '#FF4B16' };
    return { label: 'Needs Focus', badge: 'danger' as const, color: '#E63946' };
  };

  const currentTier = getScoreTier(score);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Athletic Performance Evaluations" 
        description={
          isAdminOrCoach
            ? 'Record skill assessments, evaluate technique mastery, and publish feedback notes.'
            : 'Track coach evaluations, technical milestones, and overall athletic progression.'
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Coach Evaluation Input Form (if Coach or Admin) */}
        {isAdminOrCoach && (
          <div className="lg:col-span-5 bg-[#121212] border border-[#242424] rounded-[26px] p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h3 className="font-bold text-lg text-[#F5F5F5] tracking-tight">Record Evaluation</h3>
                <p className="text-xs text-[#A6A6AC]">Submit new performance scoring</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Select Athlete *</label>
                  <div className="relative">
                    <select 
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] appearance-none cursor-pointer"
                    >
                      <option value="">Choose active member...</option>
                      {members?.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.profiles?.full_name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#A6A6AC]">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Score Slider */}
                <div className="space-y-3 p-4 rounded-2xl bg-[#181818] border border-[#262626]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Performance Score</label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-black text-[#F5F5F5]">{score}</span>
                      <span className="text-xs text-[#777777]">/ 100</span>
                    </div>
                  </div>

                  <input 
                    type="range" 
                    min={0} 
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full h-2 bg-[#282828] rounded-lg appearance-none cursor-pointer accent-[#FF4B16]"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#A6A6AC]">Rating Tier:</span>
                    <Badge variant={currentTier.badge} size="sm">
                      {currentTier.label}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Coach Review & Feedback</label>
                  <textarea 
                    rows={4}
                    placeholder="Specific tactical strengths, footwork, endurance, areas for development..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] resize-none placeholder:text-[#555555]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#1E1E1E]">
              <Button 
                variant="primary"
                className="w-full"
                disabled={!selectedMemberId || addEvalMutation.isPending}
                isLoading={addEvalMutation.isPending}
                onClick={() => addEvalMutation.mutate()}
                icon={<Save className="w-4 h-4" />}
              >
                Submit Performance Record
              </Button>
            </div>
          </div>
        )}

        {/* Evaluations History Feed (7 or 12 Cols) */}
        <div className={`${isAdminOrCoach ? 'lg:col-span-7' : 'lg:col-span-12'} bg-[#121212] border border-[#242424] rounded-[26px] p-6 sm:p-7 shadow-sm flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-[#F5F5F5] tracking-tight">Assessment History</h3>
                <p className="text-xs text-[#A6A6AC]">Verified coach scorecards</p>
              </div>
              <Badge variant="neutral" size="sm">
                {evaluations?.length ?? 0} Records
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#A6A6AC]">
                <div className="w-8 h-8 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs">Loading performance logs...</span>
              </div>
            ) : evaluations && evaluations.length > 0 ? (
              <div className="space-y-4 max-h-[540px] overflow-y-auto custom-scrollbar pr-1">
                {evaluations.map((ev: any) => {
                  const tier = getScoreTier(ev.score);

                  return (
                    <div 
                      key={ev.id} 
                      className="p-5 rounded-2xl bg-[#181818] border border-[#262626] hover:border-[#383838] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] border border-[#282828] flex flex-col items-center justify-center shrink-0">
                            <span className="font-mono text-lg font-black text-[#F5F5F5] leading-none">{ev.score}</span>
                            <span className="text-[9px] uppercase font-bold text-[#A6A6AC] mt-0.5">pts</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#F5F5F5]">
                              {ev.members?.profiles?.full_name || 'Member'}
                            </h4>
                            <p className="text-[11px] text-[#A6A6AC] mt-0.5">
                              Assessed by: Coach {ev.coach?.full_name || 'Staff'} • {new Date(ev.evaluation_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <Badge variant={tier.badge} size="sm">
                          {tier.label}
                        </Badge>
                      </div>

                      {ev.notes && (
                        <div className="p-3.5 rounded-xl bg-[#0E0E0E] border border-[#222222] text-xs text-[#A6A6AC] leading-relaxed mt-2 italic">
                          "{ev.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-[#282828] rounded-2xl bg-[#161616]/50">
                <TrendingUp className="w-8 h-8 text-[#555555] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#F5F5F5]">No performance records yet</p>
                <p className="text-xs text-[#A6A6AC] mt-1">Select an athlete and record a performance evaluation to begin tracking.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
