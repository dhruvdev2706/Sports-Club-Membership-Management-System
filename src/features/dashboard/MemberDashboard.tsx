import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';

export default function MemberDashboard() {
  const { profile, user } = useAuth();
  
  const cachedMember = useMemo(() => {
    if (!user?.id) return null;
    try {
      const raw = localStorage.getItem(`playgrid_member_${user.id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [user?.id]);

  const { data: member } = useQuery({
    queryKey: ['my_membership', user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*, membership_plans(name, duration_months, fee)')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('Membership query note:', error.message);
          return null;
        }

        if (data) {
          try {
            localStorage.setItem(`playgrid_member_${user.id}`, JSON.stringify(data));
          } catch {}
          return data;
        }
        return null;
      } catch (err) {
        console.warn('Member fetch error:', err);
        return null;
      }
    },
    enabled: !!user,
    initialData: cachedMember || undefined,
    retry: false,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const { data: myBookings } = useQuery({
    queryKey: ['my_recent_bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, facilities(name)')
          .eq('member_id', user.id)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(3);
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: !!user,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const activeRecord = member || cachedMember;
  const isMemberActive = activeRecord ? activeRecord.status === 'active' : true;
  const displayStatus = activeRecord?.status ? activeRecord.status.toUpperCase() : 'ACTIVE';
  const displayPlan = activeRecord?.membership_plans?.name || 'Standard Athlete';
  const displayMemberNumber = activeRecord?.membership_number || ('MEM-' + (user?.id ? user.id.slice(0, 6).toUpperCase() : '1001'));
  const displayExpiry = activeRecord?.plan_expiry_date || 'Active Season';

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Member Portal" 
        description={`Welcome back, ${profile?.full_name || 'Member'}. Track your club access, plan benefits, and court reservations.`}
        actions={
          <div className="flex items-center gap-3">
            <Link 
              to="/bookings" 
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF4B16] text-[#111111] hover:bg-[#E03E0E] transition-colors shadow-sm shadow-[#FF4B16]/20"
            >
              Book a Facility
            </Link>
          </div>
        }
      />
      
      {/* Top Stat Highlights */}
      <div className="grid gap-3.5 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Card */}
        <StatCard 
          label="Membership Status" 
          value={displayStatus} 
          variant={isMemberActive ? 'green' : 'orange'}
          description={isMemberActive ? "Full club facility access" : "Pending activation or approval"}
        />

        {/* Plan Card */}
        <StatCard 
          label="Current Tier" 
          value={displayPlan} 
          variant="white"
          description={displayExpiry !== 'Active Season' ? `Valid until ${displayExpiry}` : 'Active club subscription'}
        />

        {/* Upcoming Sessions Card */}
        <StatCard 
          label="Active Bookings" 
          value={myBookings ? myBookings.length : 0} 
          variant="purple"
          description="Reserved court times"
        />

        {/* Dues Card */}
        <StatCard 
          label="Outstanding Dues" 
          value="$0.00" 
          variant="pink"
          description="Account in good standing"
        />
      </div>

      {/* Main Editorial Panels */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-12">
        {/* Membership Details Card - 7 Cols */}
        <div className="lg:col-span-7 rounded-[10px] sm:rounded-[13px] border border-[#242424] bg-[#121212] p-5 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-[#F5F5F5] tracking-tight">Active Membership Pass</h3>
                <p className="text-xs text-[#A6A6AC]">Official playgrid Member Record</p>
              </div>
              <Badge variant={isMemberActive ? 'green' : 'orange'}>
                {activeRecord?.status ? (activeRecord.status.charAt(0).toUpperCase() + activeRecord.status.slice(1)) : 'Active'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-[#181818] border border-[#262626] mb-5 sm:mb-6">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#A6A6AC] font-semibold">Tier Plan</span>
                <p className="text-sm sm:text-base font-bold text-[#F5F5F5] mt-0.5 sm:mt-1">
                  {displayPlan}
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#A6A6AC] font-semibold">Member ID</span>
                <p className="text-sm sm:text-base font-bold font-mono text-[#FF4B16] mt-0.5 sm:mt-1">
                  {displayMemberNumber}
                </p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#A6A6AC] font-semibold">Renewal Date</span>
                <p className="text-sm sm:text-base font-bold text-[#F5F5F5] mt-0.5 sm:mt-1">
                  {displayExpiry}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#A6A6AC] leading-relaxed">
              <p>• Unlimited access to verified club training facilities during regular hours.</p>
              <p>• Priority court reservation up to 7 days in advance.</p>
              <p>• Member pricing for official club tournaments and coach clinics.</p>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-[#1E1E1E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link to="/payments" className="text-xs font-semibold text-[#A6A6AC] hover:text-[#F5F5F5] transition-colors">
              View Invoices & Billing History
            </Link>
            <Link to="/tournaments" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4B16] hover:text-[#E03E0E] transition-colors">
              <Trophy className="w-3.5 h-3.5" /> Browse Tournaments
            </Link>
          </div>
        </div>

        {/* Upcoming Bookings Panel - 5 Cols */}
        <div className="lg:col-span-5 rounded-[10px] sm:rounded-[13px] border border-[#242424] bg-[#121212] p-5 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-[#F5F5F5] tracking-tight">Your Reservations</h3>
                <p className="text-xs text-[#A6A6AC]">Next scheduled court sessions</p>
              </div>
              <Link to="/bookings" className="text-xs font-semibold text-[#FF4B16] hover:text-[#E03E0E]">
                Book
              </Link>
            </div>

            {myBookings && myBookings.length > 0 ? (
              <div className="space-y-3">
                {myBookings.map((b: any) => (
                  <div key={b.id} className="p-3.5 rounded-2xl bg-[#181818] border border-[#262626] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#F5F5F5]">{b.facilities?.name}</p>
                      <p className="text-xs text-[#A6A6AC] mt-0.5">
                        {new Date(b.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                        {new Date(b.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge variant="green">Confirmed</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-[#282828] rounded-2xl bg-[#161616]/50">
                <Calendar className="w-8 h-8 text-[#555555] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#F5F5F5]">No active bookings</p>
                <p className="text-xs text-[#A6A6AC] mt-1 mb-4">You don't have any upcoming court slots reserved.</p>
                <Link 
                  to="/bookings" 
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF4B16] text-[#111111] hover:bg-[#E03E0E] transition-colors"
                >
                  Reserve a Slot <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="mt-8 pt-5 border-t border-[#1E1E1E]">
            <p className="text-xs text-[#777777] text-center">
              Cancellations must be made at least 2 hours before reserved slot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
