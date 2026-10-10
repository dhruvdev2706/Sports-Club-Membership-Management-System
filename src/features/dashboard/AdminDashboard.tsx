import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Users, Clock, Calendar as CalendarIcon, DollarSign, ArrowRight, AlertTriangle } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {profile?.full_name}. Here is what's happening today.</p>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Members" 
          value={isLoading ? '--' : stats?.totalMembers} 
          icon={<Users className="w-4 h-4 text-primary" />} 
        />
        <StatCard 
          title="Pending Approvals" 
          value={isLoading ? '--' : stats?.pendingApprovals} 
          icon={<Clock className="w-4 h-4 text-warning" />} 
          trend={(stats?.pendingApprovals ?? 0) > 0 ? "Requires action" : "All clear"}
          trendColor={(stats?.pendingApprovals ?? 0) > 0 ? "text-warning" : "text-muted-foreground"}
        />
        <StatCard 
          title="Today's Bookings" 
          value={isLoading ? '--' : stats?.todaysBookings?.length} 
          icon={<CalendarIcon className="w-4 h-4 text-blue-500" />} 
        />
        <StatCard 
          title="Monthly Revenue" 
          value={isLoading ? '--' : `$${stats?.monthlyRevenue?.toFixed(2)}`} 
          icon={<DollarSign className="w-4 h-4 text-success" />} 
        />
      </div>
      
      {/* Charts & Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Main Chart */}
        <div className="lg:col-span-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-6 text-foreground">Membership Growth</h3>
          <div className="h-[300px] w-full">
            {stats?.growthData && stats.growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.growthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="members" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                {isLoading ? 'Loading data...' : 'No data available'}
              </div>
            )}
          </div>
        </div>
        
        {/* Secondary Activity Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-[calc(50%-12px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-foreground">Today's Bookings</h3>
              <Link to="/bookings" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {stats?.todaysBookings && stats.todaysBookings.length > 0 ? (
                <div className="space-y-4">
                  {stats.todaysBookings.map((b: any) => (
                    <div key={b.id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm text-foreground">{b.members?.profiles?.full_name || 'Member'}</span>
                        <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{b.facilities?.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground pb-4">
                  No bookings scheduled for today.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-[calc(50%-12px)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <h3 className="font-semibold text-lg text-foreground">Upcoming Expiries</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {stats?.expiringSoon && stats.expiringSoon.length > 0 ? (
                <div className="space-y-3">
                  {stats.expiringSoon.map((m: any) => (
                    <div key={m.id} className="flex justify-between items-center text-sm p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors border border-border/50">
                      <span className="font-medium text-foreground truncate mr-2">{m.profiles?.full_name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.plan_expiry_date).toLocaleDateString()}
                        </span>
                        <Link to={`/members/${m.id}`} className="text-primary hover:underline text-xs font-medium">View</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground pb-4">
                  No upcoming expiries.
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendColor }: { title: string, value: any, icon: React.ReactNode, trend?: string, trendColor?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground tracking-tight">{title}</h3>
        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
      {trend && (
        <p className={`text-xs mt-2 font-medium ${trendColor || 'text-muted-foreground'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}
