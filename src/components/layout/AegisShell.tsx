import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  ShieldAlert,
  UserCircle2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

interface AegisShellProps {
  children: ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Repository", href: "/systems", icon: ShieldCheck },
  { label: "Inherent Risk", href: "/workspace", icon: Bot },
  { label: "Controls", href: "/controls", icon: ClipboardList },
  { label: "Residual Risk", href: "/residual", icon: ShieldAlert },
  { label: "Reports", href: "/reports", icon: Search },
  { label: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AegisShell({ children }: AegisShellProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("aegis:sidebar-collapsed");
    setCollapsed(raw === "true");
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("aegis:sidebar-collapsed", next ? "true" : "false");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className={`grid min-h-screen grid-cols-1 ${collapsed ? "lg:grid-cols-[76px_1fr]" : "lg:grid-cols-[240px_1fr]"}`}>
        <aside className="border-r border-border bg-surface">
          <div className="sticky top-0 flex h-full flex-col">
            <div
              className={cn(
                "border-b border-border px-3 py-5",
                collapsed ? "flex flex-col items-center gap-3" : "flex items-center justify-between gap-3"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
              <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              {!collapsed ? (
                <div>
                <p className="text-sm font-semibold">Aegis AI</p>
                <p className="text-xs text-muted-foreground">Governance Copilot</p>
              </div>
              ) : null}
              </div>
              <button
                type="button"
                className="rounded-md border border-border p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={toggleSidebar}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navItems.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                  className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed ? <span className="ml-2">{item.label}</span> : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search systems, controls, reports..." className="pl-9" />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Back to Landing
                </Link>
                <ThemeToggle />
                <button className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Bell className="h-4 w-4" />
                </button>
                <button className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <UserCircle2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
