import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AdminDashboard() {
  const { profile } = useAuth();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin_dashboard_stats_full'],
    queryFn: async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString();

      const [
        membersCount, 
        pendingCount, 
        expiringMembers, 
        todaysBookings, 
        monthlyPayments,
        recentMemberships
      ] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact' }),
        supabase.from('members').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('members')
          .select('id, plan_expiry_date, profiles(full_name)')
          .eq('status', 'active')
          .gte('plan_expiry_date', todayStr)
          .order('plan_expiry_date', { ascending: true })
          .limit(5),
        supabase.from('bookings')
          .select('id, start_time, end_time, facilities(name), members(profiles(full_name))')
          .gte('start_time', todayStr)
          .lt('start_time', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString())
          .order('start_time', { ascending: true })
          .limit(5),
        supabase.from('payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', firstDayOfMonth)
          .lt('created_at', nextMonth),
        supabase.from('members')
          .select('created_at')
          .order('created_at', { ascending: true })
      ]);
      
      // Calculate Revenue
      const totalRevenue = monthlyPayments.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      // Calculate Membership Growth Data (last 6 months)
      const growthData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        
        // count members created before end of that month
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
        const count = recentMemberships.data?.filter(m => new Date(m.created_at) < endOfMonth).length || 0;
        
        growthData.push({ month: monthName, members: count });
      }

      return {
        totalMembers: membersCount.count || 0,
        pendingApprovals: pendingCount.count || 0,
        expiringSoon: expiringMembers.data || [],
        todaysBookings: todaysBookings.data || [],
        monthlyRevenue: totalRevenue,
        growthData
      };
    }
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader 
        title="Club Overview" 
        description={`Welcome back, ${profile?.full_name || 'Admin'}. Here is your operations snapshot today.`}
        actions={
          <div className="flex items-center gap-3">
            <Link 
              to="/members" 
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#242424] text-[#F5F5F5] border border-[#333333] hover:bg-[#2C2C2C] transition-colors"
            >
              Manage Members
            </Link>
            <Link 
              to="/bookings" 
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF4B16] text-[#111111] hover:bg-[#E03E0E] transition-colors shadow-sm shadow-[#FF4B16]/20"
            >
              + New Booking
            </Link>
          </div>
        }
      />
      
      {/* Varied Bold Statistic Cards Grid */}
      <div className="grid gap-3.5 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Light Contrast Card: Total Members */}
        <StatCard 
          label="Total Members" 
          value={isLoading ? '--' : stats?.totalMembers ?? 0} 
          variant="white"
          description="Registered athletic members"
        />

        {/* Orange Highlight Card: Pending Approvals or Action */}
        <StatCard 
          label="Pending Approvals" 
          value={isLoading ? '--' : stats?.pendingApprovals ?? 0} 
          variant="orange"
          change={(stats?.pendingApprovals ?? 0) > 0 ? "Action Required" : "All Clear"}
          trend={(stats?.pendingApprovals ?? 0) > 0 ? "down" : "neutral"}
          description="Membership applications to review"
        />

        {/* Purple Analytics Card: Today's Bookings */}
        <StatCard 
          label="Today's Bookings" 
          value={isLoading ? '--' : stats?.todaysBookings?.length ?? 0} 
          variant="purple"
          description="Court & facility sessions today"
        />

        {/* Emerald Green Status Card: Monthly Revenue */}
        <StatCard 
          label="Monthly Revenue" 
          value={isLoading ? '--' : `$${stats?.monthlyRevenue?.toFixed(2) ?? '0.00'}`} 
          variant="green"
          change="+14.2%"
          trend="up"
          description="Current billing cycle collection"
        />
      </div>
      
      {/* Asymmetric Editorial Grid for Visualizations and Activities */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-12">
        
        {/* Main Chart Panel - 7 Cols */}
        <div className="lg:col-span-7 rounded-[20px] sm:rounded-[26px] border border-[#242424] bg-[#0E0E0E] p-4 sm:p-7 lg:p-8 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4B16]"></span>
                <h3 className="font-bold text-base sm:text-lg text-[#F5F5F5] tracking-tight">Membership Growth</h3>
              </div>
              <p className="text-xs text-[#A6A6AC] mt-1">Net cumulative membership acquisition over past 6 months</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[11px] sm:text-xs font-semibold text-[#A6A6AC] shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-[#079C68]" />
              <span className="hidden sm:inline">Active Growth</span>
            </div>
          </div>

          <div className="h-[240px] sm:h-[300px] lg:h-[320px] w-full">
            {stats?.growthData && stats.growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.growthData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222222" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#A6A6AC' }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#A6A6AC' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '14px', 
                      border: '1px solid #333333', 
                      backgroundColor: '#161616',
                      color: '#F5F5F5',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}
                    labelStyle={{ color: '#A6A6AC', fontWeight: 600 }}
                    itemStyle={{ color: '#FF4B16', fontWeight: 700 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="members" 
                    stroke="#FF4B16" 
                    strokeWidth={3.5}
                    dot={{ fill: '#0E0E0E', strokeWidth: 3, stroke: '#FF4B16', r: 5 }}
                    activeDot={{ r: 7, fill: '#FF4B16', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[#A6A6AC]">
                {isLoading ? 'Loading analytics...' : 'No historical data available'}
              </div>
            )}
          </div>
        </div>
        
        {/* Secondary Activity Panels - 5 Cols */}
        <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
          
          {/* Today's Bookings Card */}
          <div className="rounded-[20px] sm:rounded-[26px] border border-[#242424] bg-[#121212] p-4 sm:p-6 shadow-sm flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#F5F5F5] tracking-tight">Today's Schedule</h3>
              <Link 
                to="/bookings" 
                className="text-xs font-semibold text-[#FF4B16] hover:text-[#E03E0E] flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[170px] custom-scrollbar pr-1">
              {stats?.todaysBookings && stats.todaysBookings.length > 0 ? (
                stats.todaysBookings.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#181818] border border-[#262626] hover:border-[#383838] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-2.5 py-1 rounded-xl bg-[#242424] text-[#F5F5F5] font-mono font-bold text-xs shrink-0 border border-[#333333]">
                        {new Date(b.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-[#F5F5F5] truncate">{b.members?.profiles?.full_name || 'Member'}</span>
                        <span className="text-[11px] text-[#A6A6AC] truncate">{b.facilities?.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#079C68]/15 text-[#4CD9A0] border border-[#079C68]/30 shrink-0">
                      Confirmed
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#A6A6AC]">
                  No bookings scheduled for today.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Expiries Card */}
          <div className="rounded-[26px] border border-[#242424] bg-[#121212] p-6 shadow-sm flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#F5F5F5] tracking-tight">Expiring Subscriptions</h3>
              <Link 
                to="/members" 
                className="text-xs font-semibold text-[#A6A6AC] hover:text-[#F5F5F5] flex items-center gap-1 transition-colors"
              >
                Members <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[170px] custom-scrollbar pr-1">
              {stats?.expiringSoon && stats.expiringSoon.length > 0 ? (
                stats.expiringSoon.map((m: any) => (
                  <div key={m.id} className="flex justify-between items-center p-3 rounded-2xl bg-[#181818] border border-[#262626] hover:border-[#383838] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 shrink-0 rounded-xl bg-[#FF4B16]/10 text-[#FF4B16] font-bold text-xs flex items-center justify-center border border-[#FF4B16]/20">
                        {m.profiles?.full_name ? m.profiles.full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-[#F5F5F5] truncate">{m.profiles?.full_name}</span>
                        <span className="text-[11px] text-[#A6A6AC]">
                          Expires {new Date(m.plan_expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <Link 
                      to={`/members/${m.id}`} 
                      className="shrink-0 px-2.5 py-1 rounded-xl bg-[#242424] hover:bg-[#FF4B16] hover:text-[#111111] text-[#F5F5F5] text-xs font-semibold border border-[#333333] transition-colors"
                    >
                      Renew
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#A6A6AC]">
                  No upcoming expiries this week.
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
