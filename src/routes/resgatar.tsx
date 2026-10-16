import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Gift, Loader2, TicketPercent, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Reward = {
  reward_type: string;
  reward_value: number;
  reward_text: string | null;
  code: string | null;
};

const rewardLabel: Record<string, string> = {
  percent_discount: "Desconto percentual",
  fixed_discount: "Desconto em reais",
  credit: "Crédito",
  gift: "Brinde",
  custom: "Recompensa",
};

function rewardText(reward: Reward) {
  if (reward.reward_type === "percent_discount") return `${Number(reward.reward_value).toLocaleString("pt-BR")}% de desconto`;
  if (reward.reward_type === "fixed_discount") return `R$ ${Number(reward.reward_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de desconto`;
  if (reward.reward_type === "credit") return `R$ ${Number(reward.reward_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de crédito`;
  return reward.reward_text || rewardLabel[reward.reward_type] || "Recompensa disponível";
}

export const Route = createFileRoute("/resgatar")({
  head: () => ({
    meta: [
      { title: "Resgatar cupom | RegTech" },
      { property: "og:title", content: "Resgatar cupom | RegTech" },
      { property: "og:description", content: "Resgate seu cupom e confira a recompensa da RegTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Resgate seu cupom e confira a recompensa da RegTech." },
    ],
  }),
  component: Resgatar,
});

function Resgatar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Entre na sua conta para resgatar um cupom.");
      await navigate({ to: "/auth" });
      return;
    }
    const normalized = code.trim().toUpperCase();
    if (!normalized) return toast.error("Digite o código do cupom.");

    setReward(null);
    setLoading(true);
    const { data, error } = await supabase.rpc("redeem_coupon", {
      p_code: normalized,
      p_identifier: user.email ?? user.id,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message.includes("JWT") ? "Sua sessão expirou. Entre novamente." : "Não foi possível validar o cupom agora. Tente novamente.");
      return;
    }

    const row = data?.[0];
    if (!row?.success) {
      toast.error(row?.message || "Cupom não disponível.");
      return;
    }

    setReward({
      reward_type: row.reward_type ?? "custom",
      reward_value: Number(row.reward_value ?? 0),
      reward_text: row.reward_text,
      code: row.code,
    });
    toast.success("Cupom resgatado e salvo na sua conta!");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link to="/shop" className="text-sm font-semibold text-primary hover:underline">← Voltar para a loja</Link>
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <div className="bg-primary/10 px-6 py-10 text-center sm:px-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary"><TicketPercent className="h-8 w-8" /></span>
            <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">Resgatar cupom</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Resgate seu cupom com sua conta RegTech. O cupom ficará salvo em “Minha conta” para você usar quando quiser.</p>
          </div>
          <div className="p-6 sm:p-10">
            {authLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !user ? (
              <div className="rounded-2xl border border-border p-6 text-center">
                <UserRound className="mx-auto h-8 w-8 text-primary" />
                <h2 className="mt-3 font-semibold">Entre para resgatar</h2>
                <p className="mt-2 text-sm text-muted-foreground">Para salvar o cupom na sua conta e impedir resgates duplicados, é necessário entrar ou criar uma conta.</p>
                <Link to="/auth" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Entrar ou criar conta</Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <p className="rounded-xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">Conectado como <strong className="text-foreground">{user.email}</strong></p>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold">Código do cupom</span>
                  <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EX.: BEMVINDO10" className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 font-mono text-base uppercase tracking-wide outline-none focus:border-primary" maxLength={40} />
                </label>
                <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-accent disabled:opacity-60">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} Resgatar recompensa
                </button>
              </form>
            )}
            {reward && (
              <div className="mt-6 rounded-3xl border border-primary/30 bg-primary/5 p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary"><CheckCircle2 className="h-6 w-6" /></span>
                  <div><h2 className="font-display text-xl font-bold">Cupom resgatado!</h2><p className="mt-1 text-sm text-muted-foreground">O cupom foi salvo na sua conta.</p><p className="mt-3 font-mono text-lg font-bold">{reward.code}</p><p className="mt-1 text-sm">{rewardText(reward)}</p></div>
                </div>
                <Link to="/conta" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Gift className="h-4 w-4" /> Ver meus cupons</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
