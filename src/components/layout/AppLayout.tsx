import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function AppLayout({ children, fullWidth }: AppLayoutProps) {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="aegis-container flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-violet text-primary-foreground shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)]">
              <ShieldCheck className="h-4.5 w-4.5" />
              <span className="absolute -inset-px rounded-lg bg-gradient-to-br from-primary/40 to-accent-violet/40 opacity-0 blur transition-opacity group-hover:opacity-100" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-foreground">Aegis AI</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Governance OS</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {!isLanding && (
              <nav className="flex items-center gap-1">
                <NavItem href="/interview" current={location.pathname}>Interview</NavItem>
              </nav>
            )}
            <div className="ml-2 hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground sm:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-success/70" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              <span className="font-medium">Operational</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className={cn('flex-1', !fullWidth && 'aegis-container py-8')}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 backdrop-blur">
        <div className="aegis-container flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Aegis AI · Designed for private client deployment. Store data locally within your environment.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            v1.0 · secure-by-default
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
