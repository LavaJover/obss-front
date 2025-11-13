import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, 
  ArrowRightLeft, 
  CreditCard, 
  History, 
  BarChart3, 
  Settings,
  Crown,
  Shield,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useConfig } from "@/contexts/ConfigContext";
import { DynamicFavicon } from "./DynamicFavicon";
import { HeaderIcon } from "./HeaderIcon";

// Навигация теперь создается динамически на основе конфига
const createNavigation = (config: any) => [
  { name: config.navigation.home, href: "/", icon: Home },
  { name: config.navigation.deals, href: "/deals", icon: ArrowRightLeft },
  { name: config.navigation.paymentDetails, href: "/payment-details", icon: CreditCard },
  { name: config.navigation.history, href: "/history", icon: History },
  { name: config.navigation.statistics, href: "/statistics", icon: BarChart3 },
  { name: config.navigation.settings, href: "/settings", icon: Settings },
];

const createAdminNavigation = (config: any) => [
  { name: config.navigation.adminPanel, href: "/admin", icon: Shield, restricted: true },
];

const createTeamleadNavigation = (config: any) => [
  { name: config.navigation.teamleadOffice, href: "/team-lead", icon: Crown, restricted: true },
]

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { isAdmin, isTeamLead } = usePermissions();
  const { config, isLoading } = useConfig();

  // Пока конфиг загружается, показываем заглушку
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка конфигурации...</p>
        </div>
      </div>
    );
  }

  // Создаем навигацию на основе конфига
  const navigation = createNavigation(config);
  const adminNavigation = createAdminNavigation(config);
  const teamleadNavigation = createTeamleadNavigation(config);

  const handleLogout = () => {
    logout();
    toast({
      title: config.messages.logoutSuccess,
      description: config.messages.logoutDescription,
    });
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const hasRestrictedNavigation = isAdmin || isTeamLead;

  return (
    <div className="min-h-screen bg-background">
      {/* Динамический favicon и title */}
      <DynamicFavicon />
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo с иконкой */}
            <div className="flex items-center space-x-3">
              <HeaderIcon className="text-primary flex-shrink-0" />
              <h1 className="text-xl font-bold text-primary">{config.site.title}</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive(item.href) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </NavLink>
                );
              })}
              
              {/* Restricted Sections (Admin & TeamLead) */}
              {hasRestrictedNavigation && (
                <>
                  <div className="h-6 w-px bg-border mx-2" />
                  
                  {/* TeamLead Section */}
                  {isTeamLead && teamleadNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActive(item.href) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }
                        `}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                  
                  {/* Admin Section */}
                  {isAdmin && adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActive(item.href) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }
                        `}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </>
              )}
            </nav>

            {/* Right side - Logout */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="hidden lg:flex text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Выход
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive(item.href) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
              
              {/* Restricted Sections (Admin & TeamLead) */}
              {(isAdmin || isTeamLead) && (
                <div className="pt-2 mt-2 border-t border-border">
                  
                  {/* TeamLead Section */}
                  {isTeamLead && teamleadNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActive(item.href) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }
                        `}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                  
                  {/* Admin Section */}
                  {isAdmin && adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActive(item.href) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }
                        `}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 mt-2 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Выход
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}