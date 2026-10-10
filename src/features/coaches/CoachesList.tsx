import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Award,
  Loader2,
  MoreVertical,
  ShieldCheck
} from 'lucide-react';
import { useState } from 'react';

export default function CoachesList() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: coaches, isLoading } = useQuery({
    queryKey: ['coaches_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'coach')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const filteredCoaches = coaches?.filter(coach => 
    coach.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Coaches Directory
          </h1>
          <p className="text-muted-foreground mt-1">Manage coaching staff, view profiles, and assignments.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search coaches by name or email..." 
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p>Loading coaches directory...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCoaches?.map((coach: any) => (
            <div key={coach.id} className="group flex flex-col bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden relative">
              <div className="absolute top-4 right-4">
                <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 flex flex-col items-center text-center pb-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-card flex items-center justify-center text-primary text-2xl font-bold mb-4 shadow-sm relative">
                  {coach.full_name?.charAt(0) || 'C'}
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-foreground line-clamp-1">{coach.full_name}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-2 uppercase tracking-wider">
                  <Award className="w-3 h-3 mr-1" /> Coach
                </span>
              </div>
              
              <div className="p-6 pt-2 mt-auto">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50">
                    <Mail className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                    <span className="truncate" title={coach.email || 'N/A'}>{coach.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50">
                    <Phone className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{coach.phone_number || 'No phone provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredCoaches?.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-border rounded-xl bg-muted/10">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No coaches found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No coaches match your search criteria.' : 'There are currently no coaches in the system.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
