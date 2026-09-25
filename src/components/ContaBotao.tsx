import { Link } from "@tanstack/react-router";
import { LogIn, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function ContaBotao() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="h-9 w-9" />;
  if (!user)
    return (
      <Link
        to="/auth"
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Entrar</span>
      </Link>
    );
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent"
        >
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      )}
      <Link
        to="/conta"
        aria-label="Minha conta"
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
      >
        <UserRound className="h-4 w-4" />
        <span className="hidden sm:inline">Minha conta</span>
      </Link>
    </div>
  );
}
