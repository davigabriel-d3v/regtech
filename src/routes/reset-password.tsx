import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — RegTech" },
      { name: "description", content: "Defina uma nova senha para sua conta RegTech." },
      { property: "og:title", content: "Nova senha — RegTech" },
      { property: "og:description", content: "Defina uma nova senha para sua conta RegTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) { toast.error(error.message); return; }
    toast.success("Senha alterada!");
    navigate({ to: "/conta" });
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={salvar} className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Defina sua nova senha</h1>
        <input
          type="password"
          minLength={6}
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Nova senha"
          className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
        />
        <button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent">Salvar</button>
      </form>
    </main>
  );
}
