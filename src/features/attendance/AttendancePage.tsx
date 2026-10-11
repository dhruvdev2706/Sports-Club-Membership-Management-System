import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  ClipboardCheck, 
  Check, 
  X as XIcon, 
  Clock 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AttendancePage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const queryClient = useQueryClient();
  
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const { data: batches } = useQuery({
    queryKey: ['my_batches', isAdmin ? 'all' : profile?.id],
    queryFn: async () => {
      let query = supabase.from('training_batches').select('*, sports(name), facilities(name)');
      if (!isAdmin) query = query.eq('coach_id', profile?.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const { data, error } = await supabase.from('training_sessions').select('*').eq('batch_id', selectedBatchId).order('session_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBatchId
  });

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId || !selectedBatchId) return null;
      
      const { data: members, error: mError } = await supabase
        .from('batch_members')
        .select('member_id, members(profiles(full_name))')
        .eq('batch_id', selectedBatchId);
      if (mError) throw mError;
      
      const { data: attendance, error: aError } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', selectedSessionId);
      if (aError) throw aError;
      
      return { members, attendance };
    },
    enabled: !!selectedSessionId && !!selectedBatchId
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string, status: string }) => {
      const existing = attendanceData?.attendance?.find((a: any) => a.member_id === memberId);
      if (existing) {
        const { error } = await supabase.from('attendance').update({ status }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('attendance').insert({
          session_id: selectedSessionId,
          member_id: memberId,
          status
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedSessionId] });
      toast.success('Attendance updated');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const presentCount = attendanceData?.attendance?.filter((a: any) => a.status === 'present').length || 0;
  const absentCount = attendanceData?.attendance?.filter((a: any) => a.status === 'absent').length || 0;
  const lateCount = attendanceData?.attendance?.filter((a: any) => a.status === 'late').length || 0;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Training Attendance Tracking" 
        description="Verify athlete presence, mark absences, and monitor batch training consistency."
      />

      {/* Selectors Bar */}
      <div className="bg-[#121212] border border-[#242424] rounded-[12px] p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider block">
              Select Training Batch
            </label>
            <div className="relative">
              <select 
                value={selectedBatchId} 
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setSelectedSessionId('');
                }}
                className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all appearance-none cursor-pointer"
              >
                <option value="">Choose Batch...</option>
                {batches?.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.sports?.name})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#A6A6AC]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider block">
              Select Scheduled Session
            </label>
            <div className="relative">
              <select 
                value={selectedSessionId} 
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={!selectedBatchId}
                className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all appearance-none cursor-pointer disabled:opacity-40"
              >
                <option value="">{selectedBatchId ? 'Choose Session Date...' : 'First select a batch above'}</option>
                {sessions?.map(s => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.session_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: {s.start_time} - {s.end_time}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#A6A6AC]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster & Attendance Grid */}
      {selectedSessionId ? (
        <div className="space-y-5">
          {/* Summary Pills Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121212] border border-[#242424]">
            <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">Session Roll Call Summary:</span>
            <div className="flex items-center gap-3">
              <Badge variant="green" size="md">
                Present: {presentCount}
              </Badge>
              <Badge variant="danger" size="md">
                Absent: {absentCount}
              </Badge>
              <Badge variant="orange" size="md">
                Late: {lateCount}
              </Badge>
            </div>
          </div>

          {/* Members Attendance List */}
          <div className="bg-[#121212] border border-[#242424] rounded-[12px] shadow-sm overflow-hidden">
            {loadingAttendance ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#A6A6AC]">
                <div className="w-8 h-8 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs">Loading batch roster...</span>
              </div>
            ) : attendanceData?.members && attendanceData.members.length > 0 ? (
              <div className="divide-y divide-[#1E1E1E]">
                {attendanceData.members.map((bm: any) => {
                  const record = attendanceData.attendance?.find((a: any) => a.member_id === bm.member_id);
                  const currentStatus = record?.status;

                  return (
                    <div 
                      key={bm.member_id} 
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#181818] transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#5035E8]/20 border border-[#5035E8]/35 flex items-center justify-center text-[#A594FF] font-bold text-sm shrink-0">
                          {bm.members?.profiles?.full_name ? bm.members.profiles.full_name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#F5F5F5]">
                            {bm.members?.profiles?.full_name || 'Enrolled Athlete'}
                          </p>
                          <span className="text-xs text-[#A6A6AC]">
                            Status: <strong className="capitalize text-[#F5F5F5]">{currentStatus || 'Unmarked'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Interactive Segmented Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markAttendanceMutation.mutate({ memberId: bm.member_id, status: 'present' })}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentStatus === 'present'
                              ? 'bg-[#079C68] text-white shadow-md shadow-[#079C68]/25'
                              : 'bg-[#181818] text-[#A6A6AC] border border-[#2E2E2E] hover:text-[#079C68] hover:border-[#079C68]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Present
                        </button>

                        <button
                          onClick={() => markAttendanceMutation.mutate({ memberId: bm.member_id, status: 'late' })}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentStatus === 'late'
                              ? 'bg-[#FF4B16] text-[#111111] shadow-md shadow-[#FF4B16]/25'
                              : 'bg-[#181818] text-[#A6A6AC] border border-[#2E2E2E] hover:text-[#FF4B16] hover:border-[#FF4B16]'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Late
                        </button>

                        <button
                          onClick={() => markAttendanceMutation.mutate({ memberId: bm.member_id, status: 'absent' })}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentStatus === 'absent'
                              ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/25'
                              : 'bg-[#181818] text-[#A6A6AC] border border-[#2E2E2E] hover:text-[#E63946] hover:border-[#E63946]'
                          }`}
                        >
                          <XIcon className="w-3.5 h-3.5" /> Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-[#A6A6AC]">
                No athletes are registered in this training batch yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={<ClipboardCheck className="w-8 h-8" />}
          title="Select a Batch & Session"
          description="Pick a training batch and scheduled session date above to open the member roll call."
        />
      )}
    </div>
  );
}
