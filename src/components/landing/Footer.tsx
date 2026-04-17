import { Film } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
            <Film className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold">AdCraftor</span>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} AdCraftor. All rights reserved.</p>
      </div>
    </footer>
  );
};
