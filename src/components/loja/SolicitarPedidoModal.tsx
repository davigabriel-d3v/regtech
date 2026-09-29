import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ProdutoLoja } from "@/lib/produtos.functions";

type Props = { produto: ProdutoLoja | null; onClose: () => void };
type CustomerForm = { name: string; phone: string; whatsapp: string; email: string; quantity: number; notes: string };

function formatMoney(value: number | null) {
  if (value == null) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function variationOptions(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (Array.isArray(raw)) {
      const values = raw.map(String).filter(Boolean);
      if (values.length) result[key] = values;
    }
  }
  return result;
}

export function SolicitarPedidoModal({ produto, onClose }: Props) {
  const [form, setForm] = useState<CustomerForm>({ name: "", phone: "", whatsapp: "", email: "", quantity: 1, notes: "" });
  const [variation, setVariation] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!produto) return;
    setForm({ name: "", phone: "", whatsapp: "", email: "", quantity: 1, notes: "" });
    setVariation({});
    setSuccessNumber(null);
  }, [produto]);

  const variations = useMemo(() => variationOptions(produto?.variations), [produto]);
  const variationLabels: Record<string, string> = {
    color: "Cor", cor: "Cor", size: "Tamanho", tamanho: "Tamanho",
    model: "Modelo", modelo: "Modelo", capacity: "Capacidade", capacidade: "Capacidade",
  };

  if (!produto) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) { toast.error("Informe seu nome."); return; }
    if (form.phone.replace(/\D/g, "").length < 8) { toast.error("Informe um telefone válido."); return; }
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) { toast.error("Informe um e-mail válido."); return; }
    if (form.quantity < 1) { toast.error("A quantidade deve ser maior que zero."); return; }
    const missing = Object.keys(variations).find((key) => !variation[key]);
    if (missing) { toast.error("Selecione " + (variationLabels[missing] ?? missing) + "."); return; }

    setSending(true);
    const { data, error } = await supabase.rpc("create_public_order", {
      p_product_id: produto.id,
      p_quantity: form.quantity,
      p_customer: { name: form.name.trim(), phone: form.phone.trim(), whatsapp: form.whatsapp.trim() || null, email: form.email.trim() || null },
      ...(form.notes.trim() ? { p_notes: form.notes.trim() } : {}),
      ...(Object.keys(variation).length ? { p_selected_variation: variation } : {}),
    });
    setSending(false);
    if (error) {
      toast.error(error.message || "Não foi possível enviar o pedido.");
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    setSuccessNumber(result?.order_number_display ?? "PED-000000");
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl sm:p-7" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Solicitar pedido</p><h2 className="mt-1 font-display text-2xl font-bold">Seu produto</h2></div>
          <button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>

        {successNumber ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h3 className="mt-5 font-display text-2xl font-bold">Pedido enviado com sucesso!</h3>
            <p className="mt-3 text-muted-foreground">Número do pedido:</p>
            <p className="mt-1 font-mono text-2xl font-bold text-primary">#{successNumber}</p>
            <button type="button" onClick={onClose} className="mt-8 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Fechar</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-5">
            <div className="flex gap-4 rounded-2xl border border-border bg-background/50 p-3">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary">{produto.imagemUrl ? <img src={produto.imagemUrl} alt={produto.titulo} className="h-full w-full object-cover" /> : null}</div>
              <div className="min-w-0">
                <p className="font-semibold">{produto.titulo}</p><p className="mt-1 text-xs text-muted-foreground">{produto.marca}</p>
                <p className="mt-1 font-mono text-xs font-semibold text-primary">{produto.productCode}</p><p className="mt-2 font-semibold">{formatMoney(produto.preco)}</p>
              </div>
            </div>

            {Object.keys(variations).length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(variations).map(([key, options]) => (
                  <label key={key} className="space-y-1.5 text-sm">
                    <span className="font-medium">{variationLabels[key] ?? key}</span>
                    <select required value={variation[key] ?? ""} onChange={(e) => setVariation((v) => ({ ...v, [key]: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">
                      <option value="">Selecione</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm"><span className="font-medium">Nome</span><input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-medium">Telefone</span><input required maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-medium">WhatsApp</span><input maxLength={20} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-medium">E-mail</span><input type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
              <label className="space-y-1.5 text-sm"><span className="font-medium">Quantidade</span><input type="number" min={1} max={999} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value) || 1) })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
            </div>
            <label className="block space-y-1.5 text-sm"><span className="font-medium">Observações</span><textarea maxLength={2000} rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
            <button disabled={sending} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground disabled:opacity-60">{sending && <Loader2 className="h-4 w-4 animate-spin" />}{sending ? "Enviando..." : "ENVIAR PEDIDO"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
