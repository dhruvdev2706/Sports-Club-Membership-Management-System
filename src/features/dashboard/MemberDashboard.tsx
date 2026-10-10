import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function MemberDashboard() {
  const { profile, user } = useAuth();
  
  const { data: member, isLoading } = useQuery({
    queryKey: ['my_membership', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('members')
        .select('*, membership_plans(name)')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (isLoading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Member Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back, {profile?.full_name}.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Membership Status</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
              ${member?.status === 'active' ? 'bg-green-100 text-green-800' : 
                member?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}>
              {member?.status || 'Unknown'}
            </span>
          </div>
        </div>

        {member?.current_plan_id && (
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6 md:col-span-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Current Plan Details</h3>
            <div className="mt-2 space-y-1">
              <p><span className="font-medium text-sm">Plan:</span> {member.membership_plans?.name}</p>
              <p><span className="font-medium text-sm">Member #:</span> <span className="font-mono">{member.membership_number}</span></p>
              <p><span className="font-medium text-sm">Expires:</span> {member.plan_expiry_date}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground mb-4">Upcoming Bookings</h3>
          <p className="text-sm">You have no upcoming bookings.</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground mb-4">Outstanding Dues</h3>
          <p className="text-2xl font-bold">$ 0.00</p>
        </div>
      </div>
    </div>
  );
}
