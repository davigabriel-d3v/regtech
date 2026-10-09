import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Bike, Check, Copy, Eye, ExternalLink, ImagePlus, Loader2,
  Pencil, Plus, RotateCcw, SatelliteDish, Save, Smartphone, Star, Tag, Trash2,
  Tv, Upload, X, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { BannerPrincipal } from "@/lib/banners";

type BannerRow = BannerPrincipal;

const iconOptions = [
  ["Tag", "Etiqueta / ofertas", Tag],
  ["Smartphone", "Smartphone", Smartphone],
  ["SatelliteDish", "Starlink", SatelliteDish],
  ["Bike", "Mobilidade", Bike],
  ["Tv", "TV / eletrônicos", Tv],
  ["Star", "Destaque", Star],
  ["Zap", "Promoção / energia", Zap],
] as const;

const sectionOptions = [
  ["ofertas", "Ofertas"],
  ["celulares", "Celulares"],
  ["informatica", "Informática"],
  ["eletronicos", "Eletrônicos"],
  ["acessorios", "Acessórios"],
  ["todas", "Todos os produtos"],
] as const;

const emptyForm = {
  title: "",
  subtitle: "",
  badge: "RegTech Shop",
  buttonLabel: "Comprar agora",
  actionType: "section" as BannerRow["actionType"],
  actionValue: "ofertas" as string | null,
  iconName: "Tag",
  backgroundImageUrl: "",
  backgroundMobileImageUrl: "",
  overlayOpacity: 0.12,
  backgroundColor: "#073b8c",
  textAlign: "left" as BannerRow["textAlign"],
  active: true,
  displayOrder: 0,
  autoplaySeconds: 5,
};

function toForm(item: BannerRow) {
  return {
    title: item.title,
    subtitle: item.subtitle,
    badge: item.badge,
    buttonLabel: item.buttonLabel,
    actionType: item.actionType,
    actionValue: item.actionValue,
    iconName: item.iconName,
    backgroundImageUrl: item.backgroundImageUrl ?? "",
    backgroundMobileImageUrl: item.backgroundMobileImageUrl ?? "",
    overlayOpacity: item.overlayOpacity,
    backgroundColor: item.backgroundColor ?? "#073b8c",
    textAlign: item.textAlign,
    active: item.active,
    displayOrder: item.displayOrder,
    autoplaySeconds: item.autoplaySeconds,
  };
}

export function BannerPrincipalAdmin() {
  const [items, setItems] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState<BannerRow | null>(null);
  const desktopInput = useRef<HTMLInputElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_banners")
      .select("id,title,subtitle,badge,button_label,action_type,action_value,icon_name,background_image_url,background_mobile_image_url,overlay_opacity,background_color,text_align,active,display_order,autoplay_seconds")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Não foi possível carregar os banners: " + error.message);
      setLoading(false);
      return;
    }

    setItems((data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      badge: row.badge,
      buttonLabel: row.button_label,
      actionType: row.action_type as BannerRow["actionType"],
      actionValue: row.action_value,
      iconName: row.icon_name,
      backgroundImageUrl: row.background_image_url,
      backgroundMobileImageUrl: row.background_mobile_image_url,
      overlayOpacity: Number(row.overlay_opacity),
      backgroundColor: row.background_color || "#073b8c",
      textAlign: row.text_align as BannerRow["textAlign"],
      active: row.active,
      displayOrder: row.display_order,
      autoplaySeconds: row.autoplay_seconds,
    })));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.displayOrder - b.displayOrder),
    [items],
  );

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, displayOrder: sorted.length });
    setFormOpen(true);
  }

  function openEdit(item: BannerRow) {
    setEditing(item);
    setForm(toForm(item));
    setFormOpen(true);
  }

  function update<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(file: File, mobile: boolean) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 8 MB.");
      return;
    }

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `banner-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("shop-banners").upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("shop-banners").getPublicUrl(path);
      update(mobile ? "backgroundMobileImageUrl" : "backgroundImageUrl", data.publicUrl);
      toast.success("Imagem enviada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    }
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Informe o título do banner.");
      return;
    }
    if (form.actionType === "url" && !form.actionValue?.trim()) {
      toast.error("Informe a URL do botão.");
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      badge: form.badge.trim(),
      button_label: form.buttonLabel.trim(),
      action_type: form.actionType,
      action_value: form.actionType === "none" ? null : (form.actionValue?.trim() || null),
      icon_name: form.iconName,
      background_image_url: form.backgroundImageUrl.trim() || null,
      background_mobile_image_url: form.backgroundMobileImageUrl.trim() || null,
      overlay_opacity: Number(form.overlayOpacity),
      background_color: form.backgroundColor,
      text_align: form.textAlign,
      active: form.active,
      display_order: Number(form.displayOrder),
      autoplay_seconds: Number(form.autoplaySeconds),
    };

    const result = editing
      ? await supabase.from("shop_banners").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("shop_banners").insert(payload).select().single();

    setSaving(false);
    if (result.error) {
      toast.error("Não foi possível salvar: " + result.error.message);
      return;
    }

    toast.success(editing ? "Banner atualizado." : "Banner criado.");
    setFormOpen(false);
    setEditing(null);
    await load();
  }

  async function remove(item: BannerRow) {
    if (!confirm(`Excluir o banner "${item.title}"?`)) return;
    const { error } = await supabase.from("shop_banners").delete().eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Banner excluído.");
    await load();
  }

  async function duplicate(item: BannerRow) {
    const payload = {
      title: `${item.title} (cópia)`,
      subtitle: item.subtitle,
      badge: item.badge,
      button_label: item.buttonLabel,
      action_type: item.actionType,
      action_value: item.actionValue,
      icon_name: item.iconName,
      background_image_url: item.backgroundImageUrl,
      background_mobile_image_url: item.backgroundMobileImageUrl,
      overlay_opacity: item.overlayOpacity,
      background_color: item.backgroundColor ?? "#073b8c",
      text_align: item.textAlign,
      active: false,
      display_order: sorted.length,
      autoplay_seconds: item.autoplaySeconds,
    };
    const { error } = await supabase.from("shop_banners").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Banner duplicado."); await load(); }
  }

  async function toggleActive(item: BannerRow) {
    const { error } = await supabase.from("shop_banners").update({ active: !item.active }).eq("id", item.id);
    if (error) toast.error(error.message);
    else await load();
  }

  async function move(item: BannerRow, delta: -1 | 1) {
    const index = sorted.findIndex((entry) => entry.id === item.id);
    const other = sorted[index + delta];
    if (!other) return;
    await Promise.all([
      supabase.from("shop_banners").update({ display_order: other.displayOrder }).eq("id", item.id),
      supabase.from("shop_banners").update({ display_order: item.displayOrder }).eq("id", other.id),
    ]);
    await load();
  }

  function Icon({ name }: { name: string }) {
    const Found = iconOptions.find(([key]) => key === name)?.[2] ?? Tag;
    return <Found className="h-7 w-7" />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Loja → Banner principal</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Gerenciar banner principal</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Edite os banners que aparecem no topo do /shop. Você controla texto, botão, destino,
            ícone, imagens desktop/mobile, ordem, tempo de troca e publicação.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Novo banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum banner cadastrado.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, index) => (
            <article key={item.id} className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="grid gap-0 lg:grid-cols-[minmax(300px,1.25fr)_1fr]">
                <div className="relative min-h-[220px] overflow-hidden bg-secondary">
                  {item.backgroundImageUrl ? (
                    <img src={item.backgroundImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, #061536 0%, ${item.backgroundColor ?? "#073b8c"} 58%, #12b8d5 120%)` }} />
                  )}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(2,12,36,.78), transparent), rgba(0,0,0,${Math.max(0.04, item.overlayOpacity * 0.45)})` }} />
                  <div className={`relative z-10 flex h-full min-h-[220px] items-center p-7 ${
                    item.textAlign === "center" ? "justify-center text-center" :
                    item.textAlign === "right" ? "justify-end text-right" : "justify-start text-left"
                  }`}>
                    <div className="max-w-xl text-white">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{item.badge || "RegTech Shop"}</span>
                      <h3 className="mt-3 font-display text-3xl font-bold leading-tight">{item.title}</h3>
                      <p className="mt-2 text-sm text-white/80">{item.subtitle}</p>
                      {item.buttonLabel && <span className="mt-5 inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">{item.buttonLabel}</span>}
                    </div>
                  </div>
                  <span className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white">{<Icon name={item.iconName} />}</span>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">#{index + 1}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.active ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          {item.active ? "Publicado" : "Pausado"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Troca automática: {item.autoplaySeconds}s · Destino: {item.actionType === "url" ? item.actionValue : item.actionType === "none" ? "Sem ação" : item.actionValue || "—"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button onClick={() => move(item, -1)} disabled={index === 0} className="inline-flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs disabled:opacity-35"><ArrowUp className="h-3.5 w-3.5" /> Subir</button>
                    <button onClick={() => move(item, 1)} disabled={index === sorted.length - 1} className="inline-flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs disabled:opacity-35"><ArrowDown className="h-3.5 w-3.5" /> Descer</button>
                    <button onClick={() => toggleActive(item)} className="inline-flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs"><Check className="h-3.5 w-3.5" /> {item.active ? "Pausar" : "Publicar"}</button>
                    <button onClick={() => setPreview(item)} className="inline-flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs"><Eye className="h-3.5 w-3.5" /> Prévia</button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => openEdit(item)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground"><Pencil className="h-3.5 w-3.5" /> Editar</button>
                    <button onClick={() => duplicate(item)} className="inline-flex items-center justify-center gap-1 rounded-xl border px-3 py-2.5 text-xs"><Copy className="h-3.5 w-3.5" /> Duplicar</button>
                    <button onClick={() => remove(item)} className="inline-flex items-center justify-center gap-1 rounded-xl border border-destructive/40 px-3 py-2.5 text-xs text-destructive"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
                    <button onClick={() => setPreview(item)} className="inline-flex items-center justify-center gap-1 rounded-xl border px-3 py-2.5 text-xs"><ExternalLink className="h-3.5 w-3.5" /> Visualizar</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/85 p-4 backdrop-blur">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{editing ? "Editar" : "Novo"} banner</p><h3 className="font-display text-2xl font-bold">{editing ? editing.title : "Banner principal"}</h3></div>
              <button onClick={() => setFormOpen(false)} className="rounded-lg p-2 hover:bg-secondary"><X /></button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="block space-y-1.5 text-sm"><span className="font-semibold">Título</span><input value={form.title} onChange={e => update("title", e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Internet Starlink onde você estiver" /></label>
                <label className="block space-y-1.5 text-sm"><span className="font-semibold">Subtítulo</span><textarea value={form.subtitle} onChange={e => update("subtitle", e.target.value)} rows={4} className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Instalação completa..." /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Selo</span><input value={form.badge} onChange={e => update("badge", e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Texto do botão</span><input value={form.buttonLabel} onChange={e => update("buttonLabel", e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Ação do botão</span><select value={form.actionType} onChange={e => update("actionType", e.target.value as BannerRow["actionType"])} className="w-full rounded-xl border border-border bg-background px-3 py-2.5"><option value="section">Ir para seção</option><option value="url">Abrir URL</option><option value="none">Sem ação</option></select></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Destino</span>{form.actionType === "section" ? <select value={form.actionValue ?? ""} onChange={e => update("actionValue", e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">{sectionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <input disabled={form.actionType === "none"} value={form.actionValue ?? ""} onChange={e => update("actionValue", e.target.value)} placeholder={form.actionType === "url" ? "https://..." : "Sem ação"} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 disabled:opacity-50" />}</label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Ícone</span><select value={form.iconName} onChange={e => update("iconName", e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5">{iconOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Ordem</span><input type="number" min={0} value={form.displayOrder} onChange={e => update("displayOrder", Number(e.target.value))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Troca (s)</span><input type="number" min={2} max={30} value={form.autoplaySeconds} onChange={e => update("autoplaySeconds", Number(e.target.value))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Cor do banner</span><div className="flex items-center gap-2"><input type="color" value={form.backgroundColor} onChange={e => update("backgroundColor", e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-background p-1" /><input value={form.backgroundColor} onChange={e => update("backgroundColor", e.target.value)} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 uppercase" maxLength={7} /></div><span className="text-xs text-muted-foreground">Padrão RegTech: azul #073B8C</span></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Alinhamento</span><select value={form.textAlign} onChange={e => update("textAlign", e.target.value as BannerRow["textAlign"])} className="w-full rounded-xl border border-border bg-background px-3 py-2.5"><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label>
                  <label className="block space-y-1.5 text-sm"><span className="font-semibold">Opacidade do overlay</span><input type="range" min={0} max={1} step={0.05} value={form.overlayOpacity} onChange={e => update("overlayOpacity", Number(e.target.value))} className="mt-3 w-full" /><span className="text-xs text-muted-foreground">{Math.round(form.overlayOpacity * 100)}%</span></label>
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={form.active} onChange={e => update("active", e.target.checked)} /><span><b>Publicar banner</b><br /><span className="text-xs text-muted-foreground">Somente banners publicados aparecem no /shop.</span></span></label>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-2"><div><p className="font-semibold">Imagem desktop</p><p className="text-xs text-muted-foreground">Recomendado 1600×500 ou proporção parecida.</p></div><button type="button" onClick={() => desktopInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs"><ImagePlus className="h-4 w-4" /> Enviar</button></div>
                  <input ref={desktopInput} hidden type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadImage(file, false); e.currentTarget.value = ""; }} />
                  <input value={form.backgroundImageUrl} onChange={e => update("backgroundImageUrl", e.target.value)} placeholder="Ou cole a URL da imagem" className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                  {form.backgroundImageUrl && <img src={form.backgroundImageUrl} alt="" className="mt-3 h-36 w-full rounded-xl object-cover" />}
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-2"><div><p className="font-semibold">Imagem mobile</p><p className="text-xs text-muted-foreground">Opcional. Usada em telas pequenas.</p></div><button type="button" onClick={() => mobileInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs"><Upload className="h-4 w-4" /> Enviar</button></div>
                  <input ref={mobileInput} hidden type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadImage(file, true); e.currentTarget.value = ""; }} />
                  <input value={form.backgroundMobileImageUrl} onChange={e => update("backgroundMobileImageUrl", e.target.value)} placeholder="Ou cole a URL da imagem mobile" className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                  {form.backgroundMobileImageUrl && <img src={form.backgroundMobileImageUrl} alt="" className="mt-3 h-36 w-full rounded-xl object-cover" />}
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
                  <div className="relative min-h-[280px] overflow-hidden p-6">
                    {form.backgroundImageUrl ? <img src={form.backgroundImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, #061536 0%, ${form.backgroundColor} 58%, #12b8d5 120%)` }} />}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(2,12,36,.78), transparent), rgba(0,0,0,${Math.max(0.04, form.overlayOpacity * 0.45)})` }} />
                    <div className={`relative z-10 flex min-h-[240px] items-center ${
                      form.textAlign === "center" ? "justify-center text-center" :
                      form.textAlign === "right" ? "justify-end text-right" : "justify-start text-left"
                    }`}>
                      <div className="max-w-xl text-white">
                        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{form.badge || "RegTech Shop"}</span>
                        <h4 className="mt-4 font-display text-3xl font-bold leading-tight">{form.title || "Seu título aparecerá aqui"}</h4>
                        <p className="mt-3 text-sm text-white/80">{form.subtitle || "Seu subtítulo aparecerá aqui"}</p>
                        {form.buttonLabel && <span className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold">{form.buttonLabel}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground"><span>Prévia em tempo real</span><span>{form.autoplaySeconds}s · {form.active ? "Publicado" : "Pausado"}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-5">
              <button onClick={() => setFormOpen(false)} className="rounded-full border px-5 py-2.5 text-sm">Cancelar</button>
              <button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar banner</button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-background/90 p-4 backdrop-blur" onMouseDown={() => setPreview(null)}>
          <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-border bg-card" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Prévia</p><h3 className="font-display font-bold">{preview.title}</h3></div><button onClick={() => setPreview(null)} className="rounded-lg p-2 hover:bg-secondary"><X /></button></div>
            <div className="relative min-h-[380px] overflow-hidden">
              {preview.backgroundImageUrl ? <img src={preview.backgroundImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, #061536 0%, ${preview.backgroundColor ?? "#073b8c"} 58%, #12b8d5 120%)` }} />}
              <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(2,12,36,.78), transparent), rgba(0,0,0,${Math.max(0.04, preview.overlayOpacity * 0.45)})` }} />
              <div className={`relative z-10 flex min-h-[380px] p-10 ${
                preview.textAlign === "center" ? "items-center justify-center text-center" :
                preview.textAlign === "right" ? "items-center justify-end text-right" : "items-center justify-start text-left"
              }`}>
                <div className="max-w-2xl text-white">
                  <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{preview.badge}</span>
                  <h4 className="mt-4 font-display text-4xl font-bold">{preview.title}</h4>
                  <p className="mt-3 text-lg text-white/80">{preview.subtitle}</p>
                  {preview.buttonLabel && <span className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold">{preview.buttonLabel}</span>}
                </div>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-white/40"><Icon name={preview.iconName} /></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
