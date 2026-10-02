import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Gift, Loader2, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  if (reward.reward_type === "percent_discount") {
    return `${Number(reward.reward_value).toLocaleString("pt-BR")}% de desconto`;
  }
  if (reward.reward_type === "fixed_discount") {
    return `R$ ${Number(reward.reward_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de desconto`;
  }
  if (reward.reward_type === "credit") {
    return `R$ ${Number(reward.reward_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de crédito`;
  }
  return reward.reward_text || rewardLabel[reward.reward_type] || "Recompensa disponível";
}

export const Route = createFileRoute("/resgatar")({
  head: () => ({
    meta: [
      { title: "Resgatar cupom | RegTech" },
      { name: "description", content: "Resgate seu cupom e confira a recompensa da RegTech." },
    ],
  }),
  component: Resgatar,
});

function Resgatar() {
  const [code, setCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    const person = identifier.trim();
    if (!normalized) return toast.error("Digite o código do cupom.");
    if (person.length < 3) return toast.error("Digite seu e-mail ou telefone.");

    setReward(null);
    setLoading(true);
    const { data, error } = await supabase.rpc("redeem_coupon", {
      p_code: normalized,
      p_identifier: person,
    });
    setLoading(false);

    if (error) {
      toast.error("Não foi possível validar o cupom agora. Tente novamente.");
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
    toast.success("Cupom resgatado com sucesso!");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link to="/shop" className="text-sm font-semibold text-primary hover:underline">
          ← Voltar para a loja
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <div className="bg-primary/10 px-6 py-10 text-center sm:px-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
              <TicketPercent className="h-8 w-8" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">Resgatar cupom</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Digite o código que você recebeu e informe seu e-mail ou telefone para validar e receber a recompensa configurada.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <form onSubmit={submit} className="space-y-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">Código do cupom</span>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX.: BEMVINDO10"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 font-mono text-base uppercase tracking-wide outline-none focus:border-primary"
                  maxLength={40}
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">Seu e-mail ou telefone</span>
                <input
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="voce@email.com ou (94) 99999-9999"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 outline-none focus:border-primary"
                  maxLength={255}
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-accent disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Resgatar recompensa
              </button>
            </form>

            {reward && (
              <div className="mt-6 rounded-3xl border border-primary/30 bg-primary/5 p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                    <Gift className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-primary">Recompensa liberada</p>
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-bold">{rewardText(reward)}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cupom <span className="font-mono font-semibold">{reward.code}</span> registrado para este identificador.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              A disponibilidade depende das regras definidas pela RegTech. Um mesmo cupom pode ter limites de uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
