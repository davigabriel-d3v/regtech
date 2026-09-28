import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import logo from "@/assets/regtech-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — RegTech" },
      { name: "description", content: "Acesse sua conta RegTech ou crie uma nova em poucos segundos." },
      { property: "og:title", content: "Entrar ou criar conta — RegTech" },
      { property: "og:description", content: "Acesse sua conta RegTech ou crie uma nova." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const campo =
  "w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground outline-none focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar" | "esqueci">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modo === "entrar") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;

        const [{ data: adminRole }, { data: operatorRole }] = await Promise.all([
          supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" }),
          supabase.rpc("has_role", { _user_id: data.user.id, _role: "operator" }),
        ]);

        toast.success("Login realizado com segurança.");
        navigate({ to: adminRole || operatorRole ? "/admin" : "/conta" });
      } else if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin, data: { nome, whatsapp } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/conta" });
        else toast.success("Conta criada! Confira seu e-mail para confirmar o cadastro.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos um link para redefinir sua senha.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error(msg.includes("Invalid login") ? "E-mail ou senha incorretos." : msg);
    } finally {
      setEnviando(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não foi possível entrar com Google.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <img src={logo} alt="RegTech" className="h-10 w-10" />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Recuperar senha"}
              </h1>
              <p className="text-sm text-muted-foreground">RegTech — seu upgrade começa aqui</p>
            </div>
          </div>

          {modo !== "esqueci" && (
            <>
              <button
                onClick={google}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary"
              >
                <span className="font-bold">G</span> Continuar com Google
              </button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={enviar} className="space-y-3">
            {modo === "criar" && (
              <>
                <input className={campo} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={100} />
                <input className={campo} placeholder="WhatsApp (com DDD)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required maxLength={20} />
              </>
            )}
            <input className={campo} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {modo !== "esqueci" && (
              <input className={campo} type="password" placeholder="Senha (mín. 6 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
            )}
            <button
              disabled={enviando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent disabled:opacity-60"
            >
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
              {modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Enviar link"}
            </button>
          </form>

          <div className="mt-5 space-y-2 text-center text-sm text-muted-foreground">
            {modo === "entrar" && (
              <>
                <button onClick={() => setModo("esqueci")} className="block w-full hover:text-foreground">Esqueci minha senha</button>
                <p>Não tem conta? <button onClick={() => setModo("criar")} className="font-semibold text-primary">Criar conta</button></p>
              </>
            )}
            {modo !== "entrar" && (
              <p>Já tem conta? <button onClick={() => setModo("entrar")} className="font-semibold text-primary">Entrar</button></p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
