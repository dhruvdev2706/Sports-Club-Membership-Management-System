import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronRight, User, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MembersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  
  const statusFilter = searchParams.get('status') || 'all';

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          membership_number,
          status,
          plan_expiry_date,
          profiles (full_name, email),
          membership_plans (name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const filteredMembers = members?.filter((m: any) => {
    const nameMatch = m.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      m.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.membership_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || m.status === statusFilter;
    return nameMatch && statusMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="green">Active</Badge>;
      case 'pending':
        return <Badge variant="orange">Pending Review</Badge>;
      case 'expired':
        return <Badge variant="danger">Expired</Badge>;
      case 'suspended':
        return <Badge variant="neutral">Suspended</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Members Directory" 
        description="Manage membership statuses, view profiles, and verify club credentials."
        badge={
          members && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#242424] text-[#F5F5F5] border border-[#333333]">
              {members.length} Total
            </span>
          )
        }
      />

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#121212] p-4 rounded-[20px] border border-[#242424] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A6A6AC] pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search members by name, email, or #..." 
            className="w-full pl-10 pr-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Status Dropdown Filter */}
        <div className="relative sm:w-60">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A6A6AC] pointer-events-none" />
          <select 
            className="w-full pl-10 pr-8 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 appearance-none cursor-pointer transition-all"
            value={statusFilter}
            onChange={(e) => setSearchParams(prev => {
              prev.set('status', e.target.value);
              return prev;
            })}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="pending">Pending Approval</option>
            <option value="expired">Expired Plans</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#A6A6AC]">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#121212] border border-[#242424] rounded-[24px] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0A] text-[#A6A6AC] border-b border-[#242424]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Member #</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Tier Plan</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E1E]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#A6A6AC]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading members directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((m: any) => (
                  <tr 
                    key={m.id} 
                    className="hover:bg-[#181818] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[#5035E8]/20 border border-[#5035E8]/35 flex items-center justify-center text-[#A594FF] font-bold text-xs shrink-0">
                          {m.profiles?.full_name ? m.profiles.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#F5F5F5] group-hover:text-[#FF4B16] transition-colors">
                            {m.profiles?.full_name || 'Unnamed Member'}
                          </span>
                          <span className="text-xs text-[#A6A6AC] font-mono mt-0.5">
                            {m.profiles?.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-xs text-[#F5F5F5]">
                      {m.membership_number ? (
                        <span className="px-2 py-1 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A]">
                          {m.membership_number}
                        </span>
                      ) : (
                        <span className="text-[#555555]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#F5F5F5]">
                      {m.membership_plans?.name || <span className="text-[#555555]">No Plan Assigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(m.status)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[#A6A6AC]">
                      {m.plan_expiry_date ? (
                        new Date(m.plan_expiry_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : (
                        <span className="text-[#555555]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/members/${m.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#242424] hover:bg-[#FF4B16] hover:text-[#111111] text-[#F5F5F5] text-xs font-semibold border border-[#333333] transition-colors cursor-pointer"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState 
                      icon={<Users className="w-8 h-8" />}
                      title="No members match criteria"
                      description={searchTerm ? `No results found for "${searchTerm}". Try a different search term or filter.` : 'No members registered under this filter category yet.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
