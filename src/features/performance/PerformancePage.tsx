import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  Activity, 
  User, 
  MessageSquare, 
  Target, 
  Trophy, 
  Award, 
  Loader2, 
  Calendar,
  Save,
  LineChart
} from 'lucide-react';

export default function PerformancePage() {
  const { profile } = useAuth();
  const isAdminOrCoach = profile?.role === 'admin' || profile?.role === 'coach';
  const queryClient = useQueryClient();
  
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [score, setScore] = useState<number>(50);
  const [notes, setNotes] = useState('');

  const { data: members } = useQuery({
    queryKey: ['performance_members'],
    queryFn: async () => {
      // In a real app, a coach only sees members in their assigned batches.
      // For demo, we let them see all active members.
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
      toast.success('Evaluation recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      setScore(50);
      setNotes('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success bg-success/10 border-success/20';
    if (score >= 65) return 'text-primary bg-primary/10 border-primary/20';
    if (score >= 45) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-destructive bg-destructive/10 border-destructive/20';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-success';
    if (score >= 65) return 'bg-primary';
    if (score >= 45) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" /> Performance Evaluations
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdminOrCoach 
            ? 'Track and record member progress, skills, and overall performance.' 
            : 'View your progress, coach feedback, and skill development over time.'}
        </p>
      </div>

      {isAdminOrCoach && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Record Evaluation
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" /> Select Member
                  </label>
                  <select 
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none cursor-pointer"
                    value={selectedMemberId}
                    onChange={e => setSelectedMemberId(e.target.value)}
                  >
                    <option value="">-- View All / Select Member --</option>
                    {members?.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.profiles?.full_name}</option>
                    ))}
                  </select>
                </div>
                
                {selectedMemberId && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" /> Overall Score
                        </label>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getScoreColor(score)}`}>
                          {score} / 100
                        </span>
                      </div>
                      
                      <div className="relative pt-1">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" 
                          value={score} 
                          onChange={e => setScore(Number(e.target.value))} 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>0</span>
                          <span>Needs Work</span>
                          <span>Good</span>
                          <span>Excellent</span>
                          <span>100</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" /> Coaching Notes
                      </label>
                      <textarea 
                        placeholder="Provide constructive feedback, areas of improvement, and achievements..."
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors h-32 resize-none" 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)} 
                      />
                    </div>
                    
                    <button 
                      onClick={() => addEvalMutation.mutate()}
                      disabled={addEvalMutation.isPending || !notes.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {addEvalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {addEvalMutation.isPending ? 'Saving...' : 'Save Evaluation'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-primary" /> Evaluation History
                </h2>
                {selectedMemberId && (
                  <span className="text-sm font-medium px-3 py-1 bg-background border border-border rounded-full">
                    Filtered by Member
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Member</th>
                      <th className="px-6 py-4 font-medium">Score</th>
                      <th className="px-6 py-4 font-medium">Coach</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span>Loading records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : evaluations?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Activity className="w-8 h-8 opacity-20" />
                            <span>No evaluations found.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      evaluations?.map((ev: any) => (
                        <tr key={ev.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(ev.evaluation_date).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">
                            {ev.members?.profiles?.full_name}
                          </td>
                          <td className="px-6 py-4 w-48">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 text-right font-bold text-xs ${getScoreColor(ev.score).split(' ')[0]}`}>
                                {ev.score}
                              </span>
                              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full ${getScoreBg(ev.score)}`} style={{ width: `${ev.score}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {ev.coach?.full_name}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAdminOrCoach && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Loading your performance records...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {evaluations?.map((ev: any) => (
                <div key={ev.id} className="relative flex flex-col p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ev.evaluation_date).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </div>
                    
                    {ev.score >= 90 && (
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex items-end gap-2 mb-6">
                    <span className={`text-5xl font-extrabold tracking-tighter ${getScoreColor(ev.score).split(' ')[0]}`}>
                      {ev.score}
                    </span>
                    <span className="text-lg text-muted-foreground font-medium mb-1">/100</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-1.5 mb-6 overflow-hidden">
                    <div className={`h-full rounded-full ${getScoreBg(ev.score)}`} style={{ width: `${ev.score}%` }}></div>
                  </div>
                  
                  <div className="flex-1 relative bg-muted/30 p-4 rounded-lg border border-border/50 mb-6">
                    <MessageSquare className="w-4 h-4 text-muted-foreground absolute top-4 right-4 opacity-50" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Coach Feedback</h4>
                    <p className="text-sm text-foreground leading-relaxed italic">"{ev.notes}"</p>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="w-4 h-4" />
                    Evaluated by <span className="font-medium text-foreground">{ev.coach?.full_name}</span>
                  </div>
                </div>
              ))}
              
              {evaluations?.length === 0 && (
                <div className="col-span-full p-12 text-center border border-dashed border-border rounded-xl bg-muted/10">
                  <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No evaluations yet</h3>
                  <p className="text-muted-foreground">Your performance records will appear here once your coach evaluates you.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
