import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  Bell, 
  CheckCircle2, 
  CheckCheck,
  Loader2, 
  Clock,
  Info
} from 'lucide-react';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile?.id).eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="relative">
              <Bell className="w-8 h-8 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">Stay updated with your latest alerts and messages.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllReadMutation.mutate()} 
            disabled={markAllReadMutation.isPending} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted text-foreground border border-border rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {markAllReadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p>Loading notifications...</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications?.map((n: any) => (
              <div 
                key={n.id} 
                className={`p-6 transition-all duration-300 relative ${n.is_read ? 'bg-background hover:bg-muted/30' : 'bg-primary/5 hover:bg-primary/10'}`}
              >
                {!n.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                )}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 shrink-0 p-2 rounded-full ${n.is_read ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'}`}>
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg ${n.is_read ? 'text-foreground' : 'text-foreground'}`}>
                        {n.title}
                      </h3>
                      <p className={`mt-1 leading-relaxed ${n.is_read ? 'text-muted-foreground' : 'text-foreground/90 font-medium'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs font-medium text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(n.created_at).toLocaleString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  {!n.is_read && (
                    <button 
                      onClick={() => markReadMutation.mutate(n.id)} 
                      disabled={markReadMutation.isPending}
                      className="shrink-0 p-2 text-muted-foreground hover:text-success hover:bg-success/10 rounded-full transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {notifications?.length === 0 && (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">You're all caught up!</h3>
                <p className="text-muted-foreground">You don't have any notifications at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
