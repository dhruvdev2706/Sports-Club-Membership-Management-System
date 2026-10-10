import { useAuth } from '../auth/AuthContext';

export default function CoachDashboard() {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coach Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back, {profile?.full_name}.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Upcoming Sessions</h3>
          <div className="text-2xl font-bold mt-2">--</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">My Batches</h3>
          <div className="text-2xl font-bold mt-2">--</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Pending Evaluations</h3>
          <div className="text-2xl font-bold mt-2">--</div>
        </div>
      </div>
    </div>
  );
}
