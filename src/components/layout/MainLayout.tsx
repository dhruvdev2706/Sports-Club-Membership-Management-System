import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { 
  LogOut, LayoutDashboard, Users, CreditCard, 
  GraduationCap, Building, Calendar, Receipt, ClipboardCheck, 
  Dumbbell, Trophy, TrendingUp, Bell, PieChart, Menu, X, Activity, ChevronDown 
} from 'lucide-react';

export default function MainLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'coach', 'member'] },
    { label: 'Members', path: '/members', icon: Users, roles: ['admin', 'coach'] },
    { label: 'Memberships', path: '/memberships', icon: CreditCard, roles: ['admin'] },
    { label: 'Coaches', path: '/coaches', icon: GraduationCap, roles: ['admin'] },
    { label: 'Facilities', path: '/facilities', icon: Building, roles: ['admin', 'coach'] },
    { label: 'Bookings', path: '/bookings', icon: Calendar, roles: ['admin', 'coach', 'member'] },
    { label: 'Payments', path: '/payments', icon: Receipt, roles: ['admin', 'coach', 'member'] },
    { label: 'Attendance', path: '/attendance', icon: ClipboardCheck, roles: ['admin', 'coach', 'member'] },
    { label: 'Equipment', path: '/equipment', icon: Dumbbell, roles: ['admin', 'coach', 'member'] },
    { label: 'Tournaments', path: '/tournaments', icon: Trophy, roles: ['admin', 'coach', 'member'] },
    { label: 'Performance', path: '/performance', icon: TrendingUp, roles: ['admin', 'coach', 'member'] },
    { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['admin', 'coach', 'member'] },
    { label: 'Reports', path: '/reports', icon: PieChart, roles: ['admin'] },
  ];

  const allowedNavItems = navItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  );

  const currentNavItem = navItems.find(item => item.path === location.pathname) || { label: 'Dashboard' };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">Apex Sports</span>
          </Link>
          <button 
            className="ml-auto md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-accent/10 text-primary border-l-2 border-accent' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent'}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
        
        {/* User Profile Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {profile?.role || 'Member'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-foreground hidden sm:block">
              {currentNavItem.label}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              {/* Fake notification dot for aesthetics if desired */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-card"></span>
            </Link>
            
            <div className="h-8 w-px bg-border mx-1"></div>
            
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
