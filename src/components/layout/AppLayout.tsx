import { Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function AppLayout({ children, fullWidth }: AppLayoutProps) {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="aegis-container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight">Aegis AI</span>
          </Link>

          {!isLanding && (
            <nav className="flex items-center gap-1">
              <NavItem href="/interview" current={location.pathname}>Interview</NavItem>
            </nav>
          )}
        </div>
      </header>

      {/* Main */}
      <main className={cn('flex-1', !fullWidth && 'aegis-container py-8')}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="aegis-container py-4">
          <p className="text-center text-xs text-muted-foreground">
            Aegis AI — Designed for private client deployment. Store data locally within your environment.
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ href, current, children }: { href: string; current: string; children: React.ReactNode }) {
  const isActive = current.startsWith(href);
  return (
    <Link
      to={href}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {children}
    </Link>
  );
}
