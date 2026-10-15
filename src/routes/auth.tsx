import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/regtech-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — RegTech" },
      {
        name: "description",
        content: "Acesse sua conta RegTech ou crie uma nova em poucos segundos.",
      },
      { property: "og:title", content: "Entrar ou criar conta — RegTech" },
      {
        property: "og:description",
        content: "Acesse sua conta RegTech ou crie uma nova.",
      },
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
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const termosVersao = "2026-10-02";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error_description") || params.get("error");

    if (oauthError) {
      toast.error("Não foi possível entrar com Google. Verifique a configuração do provedor e tente novamente.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (params.get("oauth") !== "google") return;

    let ativo = true;
    let processando = false;

    const finalizarLogin = async (userId: string) => {
      if (processando) return;
      processando = true;

      try {
        const { data: roleRows, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (roleError) throw roleError;
        if (!ativo) return;

        const isAdmin = roleRows?.some((row) => row.role === "admin");
        const isOperator = roleRows?.some((row) => row.role === "operator");

        toast.success("Login com Google realizado com sucesso.");
        window.history.replaceState({}, document.title, window.location.pathname);
        await navigate({ to: isAdmin || isOperator ? "/admin" : "/conta", replace: true });
      } catch (error) {
        processando = false;
        if (ativo) {
          toast.error(error instanceof Error ? error.message : "Não foi possível concluir o login.");
        }
      }
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void finalizarLogin(session.user.id);
      }
    });

    // Covers cases where Supabase has already restored the session when this page mounts.
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session?.user) void finalizarLogin(sessionData.session.user.id);
    });

    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    setEnviando(true);
    try {
      if (modo === "entrar") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;

        const { data: roleRows, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        if (roleError) throw roleError;

        const isAdmin = roleRows?.some((row) => row.role === "admin");
        const isOperator = roleRows?.some((row) => row.role === "operator");

        toast.success("Login realizado com segurança.");
        navigate({ to: isAdmin || isOperator ? "/admin" : "/conta" });
      } else if (modo === "criar") {
        if (!aceitaTermos) {
          toast.error("É necessário aceitar os Termos de Uso e a Política de Privacidade para criar a conta.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              nome: nome.trim(),
              whatsapp: whatsapp.trim(),
              termos_aceitos: true,
              termos_versao: termosVersao,
              politica_privacidade_versao: termosVersao,
              consentimento_aceito_em: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          navigate({ to: "/conta" });
        } else {
          toast.success(
            "Conta criada! Confira seu e-mail para confirmar o cadastro.",
          );
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${window.location.origin}/reset-password` },
        );
        if (error) throw error;
        toast.success("Enviamos um link para redefinir sua senha.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado.";
      const normalized = message.toLowerCase();
      if (
        normalized.includes("invalid login") ||
        normalized.includes("invalid credentials")
      ) {
        toast.error("E-mail ou senha incorretos.");
      } else {
        toast.error(message);
      }
    } finally {
      setEnviando(false);
    }
  }

  async function google() {
    setEnviando(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth?oauth=google` },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar com Google.",
      );
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <img src={logo} alt="RegTech" className="h-10 w-10" />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {modo === "entrar"
                  ? "Entrar"
                  : modo === "criar"
                    ? "Criar conta"
                    : "Recuperar senha"}
              </h1>
              <p className="text-sm text-muted-foreground">
                RegTech — seu upgrade começa aqui
              </p>
            </div>
          </div>

          {modo !== "esqueci" && (
            <>
              <button
                type="button"
                onClick={google}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-60"
                disabled={enviando}
              >
                <span className="font-bold">G</span> Continuar com Google
              </button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> ou{" "}
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={enviar} className="space-y-3">
            {modo === "criar" && (
              <>
                <input
                  className={campo}
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                  maxLength={100}
                />
                <input
                  className={campo}
                  placeholder="WhatsApp (com DDD)"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  required
                  maxLength={20}
                />
              </>
            )}
            <input
              className={campo}
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {modo !== "esqueci" && (
              <input
                className={campo}
                type="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
                minLength={6}
              />
            )}
            {modo === "criar" && (
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-4 text-sm leading-5">
                <input
                  type="checkbox"
                  checked={aceitaTermos}
                  onChange={(event) => setAceitaTermos(event.target.checked)}
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="text-muted-foreground">
                  Li e aceito os{" "}
                  <Link to="/termos" target="_blank" className="font-semibold text-primary hover:underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link to="/privacidade" target="_blank" className="font-semibold text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                  . Estou ciente de como meus dados serão tratados para o funcionamento da conta e dos serviços da RegTech.
                </span>
              </label>
            )}
            <button
              disabled={enviando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent disabled:opacity-60"
            >
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
              {modo === "entrar"
                ? "Entrar"
                : modo === "criar"
                  ? "Criar conta"
                  : "Enviar link"}
            </button>
          </form>

          <div className="mt-5 space-y-2 text-center text-sm text-muted-foreground">
            {modo === "entrar" && (
              <>
                <button
                  type="button"
                  onClick={() => setModo("esqueci")}
                  className="block w-full hover:text-foreground"
                >
                  Esqueci minha senha
                </button>
                <p>
                  Não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => { setAceitaTermos(false); setModo("criar"); }}
                    className="font-semibold text-primary"
                  >
                    Criar conta
                  </button>
                </p>
              </>
            )}
            {modo !== "entrar" && (
              <p>
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => { setAceitaTermos(false); setModo("entrar"); }}
                  className="font-semibold text-primary"
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
