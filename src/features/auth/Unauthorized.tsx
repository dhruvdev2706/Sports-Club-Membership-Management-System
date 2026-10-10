import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center p-8 bg-card rounded-lg shadow-lg border border-border">
        <h1 className="text-4xl font-bold text-destructive mb-4">403</h1>
        <h2 className="text-xl font-medium mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
        <Link to="/" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
