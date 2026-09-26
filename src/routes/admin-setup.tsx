import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { criarAdmin, adminJaExiste } from "@/lib/criarAdmin.server";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin-setup")({
  head: () => ({
    meta: [{ title: "Configuração do Admin — RegTech" }],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: roleData } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    if (roleData) throw redirect({ to: "/admin" });
    return { user: data.user };
  },
  component: AdminSetup,
});

function AdminSetup() {
  const [criando, setCriando] = useState(false);
  const [feito, setFeito] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function setup() {
    setCriando(true);
    setErro(null);
    try {
      const existe = await adminJaExiste();
      if (existe) {
        setFeito(true);
        toast.success("Conta admin já existe!");
        return;
      }
      await criarAdmin();
      setFeito(true);
      toast.success("Conta admin criada com sucesso! Acesse /admin");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setErro(msg);
      toast.error(`Falha: ${msg}`);
    } finally {
      setCriando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Configuração do Admin</h1>
              <p className="text-sm text-muted-foreground">Crie a conta administrativa do RegTech</p>
            </div>
          </div>

          {!feito ? (
            <>
              <div className="mb-4 rounded-xl border border-border bg-secondary/40 p-4 space-y-2">
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Mail className="h-4 w-4" />
                  <span><strong>E-mail:</strong> admin@gmail.com</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Mail className="h-4 w-4" />
                  <span><strong>Senha:</strong> @DaviGabriel@2240@</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  A conta será criada com papel de administrador automaticamente pelo banco de dados.
                </p>
              </div>

              {erro && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {erro}
                </div>
              )}

              <button
                onClick={setup}
                disabled={criando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent disabled:opacity-60"
              >
                {criando ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Criando conta...</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" /> Criar conta admin</>
                )}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-green-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">Admin configurado!</h2>
              <p className="text-sm text-muted-foreground">
                Acesse <a href="/admin" className="text-primary underline">/admin</a> para entrar no painel.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}