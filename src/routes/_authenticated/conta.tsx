import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LogOut, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — RegTech" },
      { name: "description", content: "Gerencie seus dados na RegTech." },
      { property: "og:title", content: "Minha conta — RegTech" },
      { property: "og:description", content: "Gerencie seus dados na RegTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Conta,
});

const campo =
  "w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function Conta() {
  const { user } = Route.useRouteContext();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("nome, whatsapp").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setNome(data.nome);
        setWhatsapp(data.whatsapp);
      }
    });
  }, [user.id]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").upsert({ id: user.id, nome, whatsapp });
    if (error) toast.error("Não foi possível salvar.");
    else toast.success("Dados atualizados!");
  }

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <div className="rounded-3xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Minha conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

          <form onSubmit={salvar} className="mt-6 space-y-3">
            <input className={campo} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
            <input className={campo} placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} />
            <button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent">Salvar dados</button>
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-foreground hover:bg-secondary">
              <Store className="h-4 w-4" /> Ir ao Shop
            </Link>
            {isAdmin && (
              <Link to="/admin" className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-sm text-primary hover:bg-secondary">
                <ShieldCheck className="h-4 w-4" /> Painel admin
              </Link>
            )}
            <button onClick={sair} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-destructive hover:bg-secondary sm:col-span-2">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
