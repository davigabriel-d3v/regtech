import { useEffect, useMemo, useState } from "react";
import {
  Check, Copy, Edit3, Loader2, Plus, Power, RefreshCcw, Search,
  TicketPercent, Trash2, RotateCcw, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  reward_type: "percent_discount" | "fixed_discount" | "credit" | "gift" | "custom";
  reward_value: number;
  reward_text: string | null;
  max_redemptions: number | null;
  max_redemptions_per_identifier: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  resettable: boolean;
  created_at: string;
  updated_at: string;
  redemption_count?: number;
};

const rewardLabels: Record<Coupon["reward_type"], string> = {
  percent_discount: "Desconto percentual",
  fixed_discount: "Desconto fixo",
  credit: "Crédito",
  gift: "Brinde",
  custom: "Recompensa personalizada",
};

const emptyForm = {
  code: "",
  name: "",
  description: "",
  reward_type: "custom" as Coupon["reward_type"],
  reward_value: 0,
  reward_text: "",
  max_redemptions: "",
  max_redemptions_per_identifier: 1,
  starts_at: "",
  expires_at: "",
  active: true,
  resettable: true,
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR") : "Sem limite";
}

function normalizeCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

function rewardDescription(c: Coupon) {
  if (c.reward_type === "percent_discount") return `${Number(c.reward_value).toLocaleString("pt-BR")}% de desconto`;
  if (c.reward_type === "fixed_discount" || c.reward_type === "credit") {
    return `R$ ${Number(c.reward_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }
  return c.reward_text || "Recompensa personalizada";
}

export function CuponsAdmin() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paused">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const [{ data: coupons, error: couponsError }, { data: redemptions, error: redemptionsError }] =
      await Promise.all([
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("coupon_redemptions").select("coupon_id"),
      ]);

    if (couponsError) {
      toast.error("Não foi possível carregar os cupons: " + couponsError.message);
      setLoading(false);
      return;
    }
    if (redemptionsError) {
      toast.error("Não foi possível carregar os resgates: " + redemptionsError.message);
    }

    const counts = new Map<string, number>();
    for (const row of redemptions ?? []) counts.set(row.coupon_id, (counts.get(row.coupon_id) ?? 0) + 1);
    setItems((coupons ?? []).map((c) => ({ ...c, redemption_count: counts.get(c.id) ?? 0 })) as Coupon[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const searchOk = !q || item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
      const statusOk = status === "all" || (status === "active" ? item.active : !item.active);
      return searchOk && statusOk;
    });
  }, [items, query, status]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: Coupon) {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      reward_type: item.reward_type,
      reward_value: Number(item.reward_value),
      reward_text: item.reward_text ?? "",
      max_redemptions: item.max_redemptions == null ? "" : String(item.max_redemptions),
      max_redemptions_per_identifier: item.max_redemptions_per_identifier,
      starts_at: item.starts_at ? new Date(item.starts_at).toISOString().slice(0, 16) : "",
      expires_at: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : "",
      active: item.active,
      resettable: item.resettable,
    });
    setOpen(true);
  }

  async function save() {
    const code = normalizeCode(form.code);
    if (code.length < 3) return toast.error("O cupom precisa ter pelo menos 3 caracteres.");
    if (!form.name.trim()) return toast.error("Informe o nome do cupom.");
    if (form.reward_type === "percent_discount" && (form.reward_value <= 0 || form.reward_value > 100)) {
      return toast.error("O desconto percentual deve ficar entre 0 e 100.");
    }
    if ((form.reward_type === "gift" || form.reward_type === "custom") && !form.reward_text.trim()) {
      return toast.error("Descreva a recompensa.");
    }
    if (form.expires_at && form.starts_at && new Date(form.expires_at) <= new Date(form.starts_at)) {
      return toast.error("A data final precisa ser posterior à inicial.");
    }

    setSaving(true);
    const payload = {
      code,
      name: form.name.trim(),
      description: form.description.trim() || null,
      reward_type: form.reward_type,
      reward_value: Number(form.reward_value) || 0,
      reward_text: form.reward_text.trim() || null,
      max_redemptions: form.max_redemptions.trim() === "" ? null : Number(form.max_redemptions),
      max_redemptions_per_identifier: Math.max(1, Number(form.max_redemptions_per_identifier) || 1),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      active: form.active,
      resettable: form.resettable,
    };

    const result = editing
      ? await supabase.from("coupons").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("coupons").insert(payload).select().single();

    setSaving(false);
    if (result.error) {
      toast.error(result.error.message.includes("coupons_code_key") ? "Esse código de cupom já existe." : result.error.message);
      return;
    }
    toast.success(editing ? "Cupom atualizado." : "Cupom criado.");
    setOpen(false);
    await load();
  }

  async function toggle(item: Coupon) {
    const { error } = await supabase.from("coupons").update({ active: !item.active }).eq("id", item.id);
    if (error) toast.error(error.message);
    else await load();
  }

  async function reset(item: Coupon) {
    if (!item.resettable) return toast.error("Este cupom está configurado para não permitir reset.");
    if (!confirm(`Resetar os resgates de "${item.code}"? O cupom poderá ser usado novamente conforme as regras configuradas.`)) return;
    const { error } = await supabase.from("coupon_redemptions").delete().eq("coupon_id", item.id);
    if (error) toast.error(error.message);
    else { toast.success("Resgates resetados."); await load(); }
  }

  async function remove(item: Coupon) {
    if (!confirm(`Excluir o cupom "${item.code}"?`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", item.id);
    if (error) toast.error(error.message);
    else { toast.success("Cupom excluído."); await load(); }
  }

  async function duplicate(item: Coupon) {
    const copyCode = `${item.code}-COPY`;
    const { error } = await supabase.from("coupons").insert({
      code: copyCode,
      name: `${item.name} (cópia)`,
      description: item.description,
      reward_type: item.reward_type,
      reward_value: item.reward_value,
      reward_text: item.reward_text,
      max_redemptions: item.max_redemptions,
      max_redemptions_per_identifier: item.max_redemptions_per_identifier,
      starts_at: null,
      expires_at: item.expires_at,
      active: false,
      resettable: item.resettable,
    });
    if (error) toast.error(error.message);
    else { toast.success(`Cupom duplicado como ${copyCode}.`); await load(); }
  }

  const totalResgates = items.reduce((sum, item) => sum + (item.redemption_count ?? 0), 0);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Marketing → Cupons</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Cupons</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Crie recompensas, defina limites e validade, pause campanhas e resete os resgates quando quiser.
            </p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Novo cupom
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-background/40 p-4"><p className="text-xs text-muted-foreground">Total</p><p className="mt-1 font-display text-2xl font-bold">{items.length}</p></div>
          <div className="rounded-2xl border border-border bg-background/40 p-4"><p className="text-xs text-muted-foreground">Ativos</p><p className="mt-1 font-display text-2xl font-bold">{items.filter(i => i.active).length}</p></div>
          <div className="rounded-2xl border border-border bg-background/40 p-4"><p className="text-xs text-muted-foreground">Pausados</p><p className="mt-1 font-display text-2xl font-bold">{items.filter(i => !i.active).length}</p></div>
          <div className="rounded-2xl border border-border bg-background/40 p-4"><p className="text-xs text-muted-foreground">Resgates registrados</p><p className="mt-1 font-display text-2xl font-bold">{totalResgates}</p></div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por código ou nome" className="w-full rounded-xl border border-border bg-card px-10 py-3 text-sm outline-none focus:border-primary" />
        </label>
        <select value={status} onChange={e => setStatus(e.target.value as typeof status)} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <option value="all">Todos</option><option value="active">Ativos</option><option value="paused">Pausados</option>
        </select>
        <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm"><RefreshCcw className="h-4 w-4" /> Atualizar</button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> :
      filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">Nenhum cupom encontrado.</div> :
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map(item => (
          <article key={item.id} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary"><TicketPercent className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold">{item.name}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.active ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{item.active ? "Ativo" : "Pausado"}</span>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(item.code).then(() => toast.success("Código copiado."))} className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-primary">{item.code}<Copy className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="flex gap-1">
                <button title="Editar" onClick={() => openEdit(item)} className="rounded-lg p-2 hover:bg-secondary"><Edit3 className="h-4 w-4" /></button>
                <button title={item.active ? "Pausar" : "Ativar"} onClick={() => void toggle(item)} className="rounded-lg p-2 hover:bg-secondary"><Power className="h-4 w-4" /></button>
                <button title="Excluir" onClick={() => void remove(item)} className="rounded-lg p-2 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            {item.description && <p className="mt-4 text-sm text-muted-foreground">{item.description}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-border p-3"><p className="text-xs text-muted-foreground">Recompensa</p><p className="mt-1 font-semibold">{rewardDescription(item)}</p><p className="mt-1 text-xs text-muted-foreground">{rewardLabels[item.reward_type]}</p></div>
              <div className="rounded-2xl border border-border p-3"><p className="text-xs text-muted-foreground">Resgates</p><p className="mt-1 font-semibold">{item.redemption_count ?? 0}{item.max_redemptions ? ` / ${item.max_redemptions}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">Por identificador: {item.max_redemptions_per_identifier}</p></div>
              <div className="rounded-2xl border border-border p-3"><p className="text-xs text-muted-foreground">Disponibilidade</p><p className="mt-1 text-xs">{formatDate(item.starts_at)} até {formatDate(item.expires_at)}</p></div>
              <div className="rounded-2xl border border-border p-3"><p className="text-xs text-muted-foreground">Reset</p><p className="mt-1 text-xs">{item.resettable ? "Permitido" : "Bloqueado"}</p></div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button onClick={() => void reset(item)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-semibold text-primary"><RotateCcw className="h-3.5 w-3.5" /> Resetar</button>
              <button onClick={() => void duplicate(item)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs"><Copy className="h-3.5 w-3.5" /> Duplicar</button>
              <button onClick={() => openEdit(item)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs"><Edit3 className="h-3.5 w-3.5" /> Editar</button>
            </div>
          </article>
        ))}
      </div>
      }

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/85 p-4 backdrop-blur">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{editing ? "Editar" : "Novo"} cupom</p><h3 className="font-display text-2xl font-bold">{editing ? editing.code : "Criar cupom"}</h3></div><button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-secondary"><X /></button></div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="block space-y-1.5 text-sm"><span className="font-semibold">Código</span><input value={form.code} onChange={e => setForm({ ...form, code: normalizeCode(e.target.value) })} maxLength={40} placeholder="BEMVINDO10" className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono uppercase" /></label>
                <label className="block space-y-1.5 text-sm"><span className="font-semibold">Nome</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Cupom de boas-vindas" className="w-full rounded-xl border border-border bg-background px-4 py-3" /></label>
                <label className="block space-y-1.5 text-sm"><span className="font-semibold">Descrição</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-border bg-background px-4 py-3" /></label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Tipo da recompensa</span><select value={form.reward_type} onChange={e => setForm({ ...form, reward_type: e.target.value as Coupon["reward_type"] })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">{Object.entries(rewardLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Valor</span><input type="number" step="0.01" min="0" value={form.reward_value} onChange={e => setForm({ ...form, reward_value: Number(e.target.value) })} disabled={form.reward_type === "gift" || form.reward_type === "custom"} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 disabled:opacity-50" /></label>
                </div>

                {(form.reward_type === "gift" || form.reward_type === "custom") && <label className="block space-y-1.5 text-sm"><span className="font-semibold">Descrição da recompensa</span><textarea value={form.reward_text} onChange={e => setForm({ ...form, reward_text: e.target.value })} rows={3} placeholder="Ex.: Brinde especial na próxima compra" className="w-full rounded-xl border border-border bg-background px-4 py-3" /></label>}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Máximo de resgates</span><input type="number" min="1" value={form.max_redemptions} onChange={e => setForm({ ...form, max_redemptions: e.target.value })} placeholder="Sem limite" className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Por pessoa/identificador</span><input type="number" min="1" value={form.max_redemptions_per_identifier} onChange={e => setForm({ ...form, max_redemptions_per_identifier: Number(e.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Início</span><input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Fim</span><input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /><span><b>Ativo</b><br /><span className="text-xs text-muted-foreground">Pode ser resgatado agora.</span></span></label>
                  <label className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm"><input type="checkbox" checked={form.resettable} onChange={e => setForm({ ...form, resettable: e.target.checked })} /><span><b>Permitir reset</b><br /><span className="text-xs text-muted-foreground">Limpar os resgates sem excluir o cupom.</span></span></label>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Como funciona</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    O cliente informa o código e um e-mail ou telefone. O resgate é validado no banco, registra a utilização e devolve a recompensa configurada.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-5"><button onClick={() => setOpen(false)} className="rounded-full border px-5 py-2.5 text-sm">Cancelar</button><button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar cupom</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
