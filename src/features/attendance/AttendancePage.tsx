import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  ClipboardList, 
  Users, 
  Calendar, 
  Check, 
  X as XIcon, 
  Clock, 
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
  UserMinus
} from 'lucide-react';

export default function AttendancePage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const queryClient = useQueryClient();
  
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const { data: batches, isLoading: loadingBatches } = useQuery({
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
      
      // Get all members of the batch
      const { data: members, error: mError } = await supabase
        .from('batch_members')
        .select('member_id, members(profiles(full_name))')
        .eq('batch_id', selectedBatchId);
      if (mError) throw mError;
      
      // Get existing attendance for the session
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
      toast.success('Attendance updated successfully');
    },
    onError: (err: any) => toast.error(err.message)
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance Tracking</h1>
        <p className="text-muted-foreground mt-1">Manage and record attendance for your training sessions.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-16 h-16" />
          </div>
          <div className="relative z-10">
            <h2 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
              Select Batch
            </h2>
            {loadingBatches ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading batches...
              </div>
            ) : (
              <select 
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none cursor-pointer relative z-20"
                value={selectedBatchId}
                onChange={e => { setSelectedBatchId(e.target.value); setSelectedSessionId(''); }}
              >
                <option value="">-- Choose a Training Batch --</option>
                {batches?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.sports?.name})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className={`bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden transition-opacity duration-300 ${!selectedBatchId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar className="w-16 h-16" />
          </div>
          <div className="relative z-10">
            <h2 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedBatchId ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>2</span>
              Select Session
            </h2>
            <select 
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none cursor-pointer relative z-20"
              value={selectedSessionId}
              onChange={e => setSelectedSessionId(e.target.value)}
              disabled={!selectedBatchId}
            >
              <option value="">-- Choose a Session --</option>
              {sessions?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.session_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {s.start_time.substring(0, 5)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedSessionId && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-5 bg-muted/30 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Roster & Attendance
            </h3>
            
            {attendanceData && (
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success"></span> {attendanceData.attendance?.filter((a: any) => a.status === 'present').length || 0} Present</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive"></span> {attendanceData.attendance?.filter((a: any) => a.status === 'absent').length || 0} Absent</div>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Member Name</th>
                  <th className="px-6 py-4 font-medium">Current Status</th>
                  <th className="px-6 py-4 font-medium text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingAttendance ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>Loading roster...</span>
                      </div>
                    </td>
                  </tr>
                ) : attendanceData?.members?.map((bm: any) => {
                  const record = attendanceData.attendance?.find((a: any) => a.member_id === bm.member_id);
                  return (
                    <tr key={bm.member_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {bm.members?.profiles?.full_name?.charAt(0) || 'M'}
                          </div>
                          <span className="font-medium text-foreground">{bm.members?.profiles?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                          ${record?.status === 'present' ? 'bg-success/10 text-success border-success/20' : 
                            record?.status === 'absent' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                            record?.status === 'late' ? 'bg-warning/10 text-warning border-warning/20' : 
                            'bg-muted text-muted-foreground border-border'}`}>
                          {record?.status === 'present' && <Check className="w-3 h-3 mr-1.5" />}
                          {record?.status === 'absent' && <XIcon className="w-3 h-3 mr-1.5" />}
                          {record?.status === 'late' && <Clock className="w-3 h-3 mr-1.5" />}
                          {!record?.status && <AlertCircle className="w-3 h-3 mr-1.5" />}
                          <span className="capitalize">{record?.status || 'Not Marked'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => markAttendanceMutation.mutate({ memberId: bm.member_id, status: 'present' })}
                            className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors border
                              ${record?.status === 'present' ? 'bg-success text-white border-success' : 'bg-background hover:bg-success/10 text-success border-border hover:border-success/30'}`}
                            title="Mark Present"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => markAttendanceMutation.mutate({ memberId: bm.member_id, status: 'absent' })}
                            className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors border
                              ${record?.status === 'absent' ? 'bg-destructive text-white border-destructive' : 'bg-background hover:bg-destructive/10 text-destructive border-border hover:border-destructive/30'}`}
                            title="Mark Absent"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => markAttendanceMutation.mutate({ memberId: bm.member_id, status: 'late' })}
                            className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors border
                              ${record?.status === 'late' ? 'bg-warning text-white border-warning' : 'bg-background hover:bg-warning/10 text-warning border-border hover:border-warning/30'}`}
                            title="Mark Late"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {attendanceData?.members?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground border-t border-border border-dashed">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 opacity-20" />
                        <span>No members found in this batch.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
