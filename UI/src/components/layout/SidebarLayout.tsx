import { Outlet, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Monitor, 
  ListTodo, 
  User, 
  FileText, 
  Activity, 
  
  LogOut,
  Shield
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import blackvLogo from '@/assets/blackv-logo.png';


const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Monitor },
  { name: "Tasks", href: "/tasks", icon: ListTodo },
  { name: "Profiles", href: "/profiles", icon: User },
  { name: "Results", href: "/results", icon: FileText },
  { name: "Activity", href: "/activity", icon: Activity },
  
];

export default function SidebarLayout() {
  const { user, logout, hasRole } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Fixed Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6 gap-3">
            <img src={blackvLogo} alt="BlackV Logo" className="h-12 w-12 object-contain mix-blend-lighten" />
            <span className="text-2xl font-bold tracking-tight text-sidebar-foreground">C2</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-smooth ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary shadow-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Management Link (Admin Only) */}
          {hasRole('admin') && (
            <>
              <Separator className="bg-sidebar-border" />
              <div className="px-4 py-2">
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-smooth ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary shadow-glow"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Shield className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                      <span>User Management</span>
                    </>
                  )}
                </NavLink>
              </div>
            </>
          )}

          {/* User Info & Logout */}
          <div className="mt-auto border-t border-sidebar-border p-4 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/30 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.username}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>

            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/30 px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <div className="flex-1 text-xs">
                <div className="font-medium text-sidebar-foreground">System Online</div>
                <div className="text-muted-foreground">All services operational</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
