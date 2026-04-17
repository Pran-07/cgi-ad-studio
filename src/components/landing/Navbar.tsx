import { Link } from "react-router-dom";
import { Film, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const { user, signOut } = useAuth();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Film className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">AdCraftor</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <button onClick={() => scrollTo("features")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</button>
          <button onClick={() => scrollTo("pricing")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</button>
          <button onClick={() => scrollTo("contact")} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Contact</button>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/app">Dashboard</Link></Button>
              <Button onClick={signOut} variant="outline" size="sm"><LogOut className="mr-1 h-4 w-4" />Logout</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
              <Button asChild size="sm" className="bg-gradient-primary shadow-glow hover:opacity-90"><Link to="/auth?mode=signup">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
