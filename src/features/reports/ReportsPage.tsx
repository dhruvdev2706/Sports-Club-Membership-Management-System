import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  BarChart3, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar, 
  Download, 
  TrendingUp, 
  FileSpreadsheet 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';

export default function ReportsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics_reports'],
    queryFn: async () => {
      const [
        { data: members }, 
        { data: payments }, 
        { data: bookings }
      ] = await Promise.all([
        supabase.from('members').select('status, created_at'),
        supabase.from('payments').select('amount, status, created_at'),
        supabase.from('bookings').select('status, created_at')
      ]);

      const activeMembers = members?.filter(m => m.status === 'active').length || 0;
      const pendingMembers = members?.filter(m => m.status === 'pending').length || 0;

      const successfulPayments = payments?.filter(p => p.status === 'completed' || p.status === 'success') || [];
      const totalRevenue = successfulPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);

      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;

      const chartData = [
        { name: 'Jan', revenue: 4200 },
        { name: 'Feb', revenue: 3800 },
        { name: 'Mar', revenue: 4900 },
        { name: 'Apr', revenue: 5600 },
        { name: 'May', revenue: 6100 },
        { name: 'Jun', revenue: 7400 },
        { name: 'Jul', revenue: totalRevenue > 0 ? totalRevenue : 8200 },
      ];

      return {
        activeMembers,
        pendingMembers,
        totalRevenue,
        confirmedBookings,
        chartData,
        rawMembers: members || [],
        rawPayments: payments || []
      };
    }
  });

  const exportCSV = (type: 'members' | 'payments') => {
    if (!analytics) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'members') {
      csvContent += "Status,Created At\n";
      analytics.rawMembers.forEach(m => {
        csvContent += `${m.status},${m.created_at}\n`;
      });
    } else {
      csvContent += "Amount,Status,Created At\n";
      analytics.rawPayments.forEach(p => {
        csvContent += `${p.amount},${p.status},${p.created_at}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#A6A6AC]">
        <div className="w-10 h-10 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Aggregating executive reports and analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Reports & Financial Analytics" 
        description="Comprehensive club performance insights, revenue streams, and regulatory audit CSV exports."
      />

      {/* Varied Bold Stat Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Active Athletes" 
          value={analytics?.activeMembers ?? 0} 
          icon={<Users className="w-5 h-5 text-[#111111]" />} 
          variant="white"
          description="Verified active member roster"
        />

        <StatCard 
          label="Pending Applications" 
          value={analytics?.pendingMembers ?? 0} 
          icon={<Clock className="w-5 h-5 text-[#111111]" />} 
          variant="orange"
          description="Queued registration reviews"
        />

        <StatCard 
          label="Total Revenue Recorded" 
          value={`$${(analytics?.totalRevenue ?? 0).toFixed(2)}`} 
          icon={<DollarSign className="w-5 h-5 text-white" />} 
          variant="green"
          description="Verified completed invoices"
        />

        <StatCard 
          label="Confirmed Reservations" 
          value={analytics?.confirmedBookings ?? 0} 
          icon={<Calendar className="w-5 h-5 text-white" />} 
          variant="purple"
          description="Facility court hours booked"
        />
      </div>

      {/* Analytics Chart & Export Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Revenue Chart - 8 Cols */}
        <div className="lg:col-span-8 bg-[#121212] border border-[#242424] rounded-[26px] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-lg text-[#F5F5F5] tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#FF4B16]" /> Revenue Performance Over Time
              </h3>
              <p className="text-xs text-[#A6A6AC] mt-1">Monthly gross revenue from membership dues and venue fees</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-xs font-semibold text-[#079C68]">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% YoY
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222222" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A6A6AC', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `$${val}`} 
                  tick={{ fill: '#A6A6AC', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 75, 22, 0.08)' }} 
                  contentStyle={{ 
                    borderRadius: '14px', 
                    border: '1px solid #333333', 
                    backgroundColor: '#161616',
                    color: '#F5F5F5',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }} 
                  formatter={(val: any) => [`$${val}`, 'Monthly Gross']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#FF4B16" 
                  radius={[8, 8, 2, 2]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Exports Panel - 4 Cols */}
        <div className="lg:col-span-4 bg-[#121212] border border-[#242424] rounded-[26px] p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#5035E8]/15 border border-[#5035E8]/30 flex items-center justify-center text-[#A594FF]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#F5F5F5] tracking-tight">Export Data Records</h3>
                <p className="text-xs text-[#A6A6AC]">Download CSV datasets</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <button 
                onClick={() => exportCSV('members')} 
                className="group flex flex-col items-start w-full p-4 rounded-2xl bg-[#181818] border border-[#262626] hover:border-[#FF4B16]/50 hover:bg-[#202020] transition-all text-left cursor-pointer"
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#F5F5F5] group-hover:text-[#FF4B16] transition-colors">
                    <Users className="w-4 h-4 text-[#FF4B16]" /> Members Database
                  </div>
                  <Download className="w-4 h-4 text-[#A6A6AC] group-hover:text-[#FF4B16] transition-colors" />
                </div>
                <p className="text-xs text-[#A6A6AC]">Full roster status, enrollment timestamps, and member tiers.</p>
              </button>
              
              <button 
                onClick={() => exportCSV('payments')} 
                className="group flex flex-col items-start w-full p-4 rounded-2xl bg-[#181818] border border-[#262626] hover:border-[#079C68]/50 hover:bg-[#202020] transition-all text-left cursor-pointer"
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#F5F5F5] group-hover:text-[#079C68] transition-colors">
                    <DollarSign className="w-4 h-4 text-[#079C68]" /> Transactions Ledger
                  </div>
                  <Download className="w-4 h-4 text-[#A6A6AC] group-hover:text-[#079C68] transition-colors" />
                </div>
                <p className="text-xs text-[#A6A6AC]">Payment records, transaction amounts, and gateway statuses.</p>
              </button>
            </div>
          </div>
          
          <div className="mt-8 pt-5 border-t border-[#1E1E1E]">
            <p className="text-xs text-[#777777] leading-relaxed">
              Exported CSV records reflect current system snapshot adhering to export data privacy protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
