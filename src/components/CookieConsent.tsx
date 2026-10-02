import { useEffect, useState } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "regtech-cookie-consent-v1";

type Consent = "accepted" | "essential";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Consent | null;
      setVisible(saved !== "accepted" && saved !== "essential");
    } catch {
      setVisible(true);
    }
  }, []);

  function save(value: Consent) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // O banner continua funcional mesmo quando o navegador bloqueia armazenamento local.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] p-3 sm:p-4">
      <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Cookie className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-foreground">Sua privacidade importa</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Usamos tecnologias essenciais para manter sua sessão, preferências e segurança. Não usamos cookies de publicidade para condicionar o acesso ao site.
                Consulte nossa{" "}
                <Link to="/cookies" className="font-semibold text-primary hover:underline">Política de Cookies</Link>{" "}
                e nossa{" "}
                <Link to="/privacidade" className="font-semibold text-primary hover:underline">Política de Privacidade</Link>.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
            <button
              type="button"
              onClick={() => save("essential")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <ShieldCheck className="h-4 w-4" /> Apenas essenciais
            </button>
            <button
              type="button"
              onClick={() => save("accepted")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-accent"
            >
              Aceitar cookies
            </button>
          </div>

          <button
            type="button"
            aria-label="Fechar aviso de cookies"
            onClick={() => save("essential")}
            className="absolute right-5 top-5 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground lg:static"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
