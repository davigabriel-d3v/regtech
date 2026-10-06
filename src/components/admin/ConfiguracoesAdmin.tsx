import { useEffect, useState } from "react";
import { Bell, Globe2, Mail, MessageCircle, Save, Settings2, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Settings = {
  store_name: string;
  support_email: string;
  support_phone: string;
  store_city: string;
  order_message: string;
  public_store_enabled: boolean;
  maintenance_message: string;
};

const initial: Settings = {
  store_name: "RegTech",
  support_email: "",
  support_phone: "",
  store_city: "Tucumã - PA",
  order_message: "Olá! Quero fazer um pedido pela RegTech.",
  public_store_enabled: true,
  maintenance_message: "",
};

export function ConfiguracoesAdmin() {
  const [settings, setSettings] = useState<Settings>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("shop_settings")
      .select("store_name,support_email,support_phone,store_city,order_message,public_store_enabled,maintenance_message")
      .eq("id", "default")
      .maybeSingle();
    if (error) toast.error("Não foi possível carregar as configurações.");
    if (data) setSettings({
      store_name: data.store_name ?? initial.store_name,
      support_email: data.support_email ?? "",
      support_phone: data.support_phone ?? "",
      store_city: data.store_city ?? initial.store_city,
      order_message: data.order_message ?? initial.order_message,
      public_store_enabled: data.public_store_enabled ?? true,
      maintenance_message: data.maintenance_message ?? "",
    });
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    if (!settings.store_name.trim()) return toast.error("Informe o nome da loja.");
    setSaving(true);
    const { error } = await (supabase as any).from("shop_settings").upsert({
      id: "default",
      store_name: settings.store_name.trim(),
      support_email: settings.support_email.trim() || null,
      support_phone: settings.support_phone.replace(/\D/g, "") || null,
      store_city: settings.store_city.trim() || null,
      order_message: settings.order_message.trim() || null,
      public_store_enabled: settings.public_store_enabled,
      maintenance_message: settings.maintenance_message.trim() || null,
      updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    }, { onConflict: "id" });
    setSaving(false);
    if (error) toast.error("Não foi possível salvar: " + error.message);
    else toast.success("Configurações salvas com sucesso.");
  }

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">Carregando configurações...</div>;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Configurações → Sistema</p>
        <h2 className="mt-1 font-display text-2xl font-bold">Configurações da loja</h2>
        <p className="mt-1 text-sm text-muted-foreground">Controle os dados gerais, contato, disponibilidade da loja e mensagens usadas no atendimento.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary"><Store className="h-5 w-5" /></span>
            <div><h3 className="font-display text-lg font-bold">Identidade da loja</h3><p className="text-sm text-muted-foreground">Informações básicas exibidas pela operação.</p></div>
          </div>
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium">Nome da loja<input value={settings.store_name} onChange={e=>setSettings({...settings,store_name:e.target.value})} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /></label>
            <label className="block text-sm font-medium">Cidade / região<input value={settings.store_city} onChange={e=>setSettings({...settings,store_city:e.target.value})} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /></label>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary"><MessageCircle className="h-5 w-5" /></span>
            <div><h3 className="font-display text-lg font-bold">Atendimento</h3><p className="text-sm text-muted-foreground">Canais de contato do cliente.</p></div>
          </div>
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium">WhatsApp<input value={settings.support_phone} onChange={e=>setSettings({...settings,support_phone:e.target.value})} inputMode="tel" placeholder="(94) 99999-9999" className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /></label>
            <label className="block text-sm font-medium">E-mail de suporte<input value={settings.support_email} onChange={e=>setSettings({...settings,support_email:e.target.value})} type="email" placeholder="suporte@regtech.com.br" className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /></label>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary"><Globe2 className="h-5 w-5" /></span>
            <div><h3 className="font-display text-lg font-bold">Disponibilidade da loja</h3><p className="text-sm text-muted-foreground">Controle rápido para colocar a vitrine em manutenção.</p></div>
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border p-4">
            <div><p className="font-semibold">Loja pública ativa</p><p className="mt-1 text-xs text-muted-foreground">Quando desativada, você pode usar a mensagem de manutenção para orientar os clientes.</p></div>
            <input type="checkbox" checked={settings.public_store_enabled} onChange={e=>setSettings({...settings,public_store_enabled:e.target.checked})} className="h-5 w-5 accent-primary" />
          </label>
          <label className="mt-3 block text-sm font-medium">Mensagem de manutenção<textarea value={settings.maintenance_message} onChange={e=>setSettings({...settings,maintenance_message:e.target.value})} rows={3} placeholder="Estamos atualizando a loja. Volte em alguns minutos." className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm" /></label>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary"><Bell className="h-5 w-5" /></span>
            <div><h3 className="font-display text-lg font-bold">Mensagens de pedido</h3><p className="text-sm text-muted-foreground">Texto padrão usado ao iniciar atendimento.</p></div>
          </div>
          <label className="mt-5 block text-sm font-medium">Mensagem inicial<textarea value={settings.order_message} onChange={e=>setSettings({...settings,order_message:e.target.value})} rows={5} className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm" /></label>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Somente administradores podem alterar estas configurações.</p><p className="text-sm text-muted-foreground">As configurações são salvas no banco e ficam disponíveis para a loja.</p></div></div>
        <button type="button" onClick={()=>void save()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar configurações"}</button>
      </div>
    </section>
  );
}
