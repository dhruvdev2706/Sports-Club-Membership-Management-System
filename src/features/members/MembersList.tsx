import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronRight, User, Loader2 } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Members Directory</h1>
          <p className="text-muted-foreground mt-1">Manage and view all registered sports club members.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name, email, or member #" 
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select 
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setSearchParams(prev => {
              prev.set('status', e.target.value);
              return prev;
            })}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Member #</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Expiry</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading members...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <User className="w-8 h-8 opacity-20" />
                      <span>No members found matching your filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers?.map((member: any) => (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {member.profiles?.full_name ? member.profiles.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{member.profiles?.full_name}</div>
                          <div className="text-xs text-muted-foreground">{member.profiles?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground">
                      {member.membership_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {member.membership_plans?.name || <span className="text-muted-foreground italic">None</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${member.status === 'active' ? 'bg-success/10 text-success border-success/20' : 
                          member.status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' : 
                          'bg-destructive/10 text-destructive border-destructive/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                          ${member.status === 'active' ? 'bg-success' : 
                            member.status === 'pending' ? 'bg-warning' : 
                            'bg-destructive'}`}></span>
                        <span className="capitalize">{member.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {member.plan_expiry_date ? new Date(member.plan_expiry_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/members/${member.id}`} 
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                      >
                        View <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
