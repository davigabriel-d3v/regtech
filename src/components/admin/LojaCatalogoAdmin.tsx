import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Loader2, MessageCircle, Save, Search, Star, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string; product_code: string; name: string; price: number;
  promotional_price: number | null; stock: number; status: "active" | "inactive";
  catalog_featured: boolean; catalog_order: number; category_id: string | null; brand_id: string | null;
};
type Settings = {
  whatsapp_phone: string; offers_enabled: boolean; offers_title: string; offers_subtitle: string;
  offers_limit: number; featured_enabled: boolean; featured_title: string; featured_subtitle: string; featured_limit: number;
};
const initialSettings: Settings = {
  whatsapp_phone: "5594992989833", offers_enabled: true, offers_title: "Ofertas do dia", offers_subtitle: "", offers_limit: 8,
  featured_enabled: true, featured_title: "Destaques da RegTech", featured_subtitle: "Produtos selecionados para aparecer em destaque na vitrine.", featured_limit: 8,
};
const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const digits = (value: string) => value.replace(/\D/g, "");

export function LojaCatalogoAdmin() {
  const [products, setProducts] = useState<Row[]>([]);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [categories, setCategories] = useState<Record<string,string>>({});
  const [brands, setBrands] = useState<Record<string,string>>({});
  const [search, setSearch] = useState("");
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [p, s, c, b] = await Promise.all([
      supabase.from("products").select("id,product_code,name,price,promotional_price,stock,status,catalog_featured,catalog_order,category_id,brand_id").order("catalog_featured",{ascending:false}).order("catalog_order",{ascending:true}).order("created_at",{ascending:false}),
      supabase.from("shop_settings").select("whatsapp_phone,offers_enabled,offers_title,offers_subtitle,offers_limit,featured_enabled,featured_title,featured_subtitle,featured_limit").eq("id","default").maybeSingle(),
      supabase.from("product_categories").select("id,name"),
      supabase.from("marcas").select("id,nome").eq("ativo",true),
    ]);
    if (p.error) toast.error("Erro ao carregar catálogo: " + p.error.message);
    if (s.error) toast.error("Erro ao carregar configurações: " + s.error.message);
    setProducts((p.data ?? []) as Row[]);
    if (s.data) setSettings({
      whatsapp_phone:s.data.whatsapp_phone, offers_enabled:s.data.offers_enabled, offers_title:s.data.offers_title, offers_subtitle:s.data.offers_subtitle ?? "", offers_limit:s.data.offers_limit,
      featured_enabled:s.data.featured_enabled, featured_title:s.data.featured_title, featured_subtitle:s.data.featured_subtitle ?? "", featured_limit:s.data.featured_limit,
    });
    setCategories(Object.fromEntries((c.data ?? []).map(x => [x.id,x.name])));
    setBrands(Object.fromEntries((b.data ?? []).map(x => [x.id,x.nome])));
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      const match = !q || p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q) || (brands[p.brand_id ?? ""] ?? "").toLowerCase().includes(q);
      return match && (!onlyOffers || p.promotional_price != null) && (!onlyFeatured || p.catalog_featured);
    });
  }, [products,search,onlyOffers,onlyFeatured,brands]);

  async function saveSettings() {
    const phone = digits(settings.whatsapp_phone);
    if (phone.length < 10 || phone.length > 15) return void toast.error("Informe um número de WhatsApp válido com DDI e DDD.");
    setSaving(true);
    const { error } = await supabase.from("shop_settings").update({
      whatsapp_phone:phone, offers_enabled:settings.offers_enabled, offers_title:settings.offers_title.trim() || "Ofertas do dia",
      offers_subtitle:settings.offers_subtitle.trim() || null, offers_limit:Math.min(24,Math.max(1,Number(settings.offers_limit)||8)),
      featured_enabled:settings.featured_enabled, featured_title:settings.featured_title.trim() || "Destaques da RegTech",
      featured_subtitle:settings.featured_subtitle.trim() || null, featured_limit:Math.min(24,Math.max(1,Number(settings.featured_limit)||8)),
    }).eq("id","default");
    setSaving(false);
    if (error) toast.error("Não foi possível salvar: " + error.message); else toast.success("Configurações da loja salvas.");
  }

  async function setOffer(product: Row, value: string) {
    const parsed = value.trim() === "" ? null : Number(value);
    if (parsed != null && (!Number.isFinite(parsed) || parsed <= 0 || parsed >= product.price)) return void toast.error("O preço de oferta deve ser maior que zero e menor que o preço original.");
    const { error } = await supabase.from("products").update({ promotional_price: parsed }).eq("id",product.id);
    if (error) toast.error(error.message); else { setProducts(cur => cur.map(p => p.id===product.id ? {...p,promotional_price:parsed} : p)); toast.success(parsed == null ? "Oferta removida." : "Preço de oferta atualizado."); }
  }
  async function toggleStatus(product: Row) {
    const next = product.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("products").update({status:next}).eq("id",product.id);
    if (error) toast.error(error.message); else setProducts(cur => cur.map(p => p.id===product.id ? {...p,status:next} : p));
  }
  async function toggleFeatured(product: Row) {
    const next = !product.catalog_featured;
    const nextOrder = next ? Math.max(0,...products.filter(p=>p.catalog_featured).map(p=>p.catalog_order))+1 : product.catalog_order;
    const { error } = await supabase.from("products").update({catalog_featured:next,catalog_order:nextOrder}).eq("id",product.id);
    if (error) toast.error(error.message); else { setProducts(cur=>cur.map(p=>p.id===product.id ? {...p,catalog_featured:next,catalog_order:nextOrder}:p)); toast.success(next ? "Produto entrou nos destaques." : "Produto saiu dos destaques."); }
  }
  async function moveFeatured(product: Row, direction: -1 | 1) {
    const featured = products.filter(p=>p.catalog_featured).sort((a,b)=>a.catalog_order-b.catalog_order);
    const index = featured.findIndex(p=>p.id===product.id), target = index + direction;
    if (index < 0 || target < 0 || target >= featured.length) return;
    const other=featured[target];
    if (!other) return;
    const results=await Promise.all([
      supabase.from("products").update({catalog_order:other.catalog_order}).eq("id",product.id),
      supabase.from("products").update({catalog_order:product.catalog_order}).eq("id",other.id),
    ]);
    const error=results.find(r=>r.error)?.error;
    if (error) toast.error(error.message); else await load();
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  const offerCount=products.filter(p=>p.promotional_price!=null).length;
  const featuredCount=products.filter(p=>p.catalog_featured).length;
  return <section className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Configurações → Loja e catálogo</p><h2 className="mt-1 font-display text-2xl font-bold">Loja e catálogo</h2><p className="mt-1 text-sm text-muted-foreground">Controle ofertas, destaques da vitrine e o WhatsApp que recebe os pedidos iniciados pelos produtos do /shop.</p></div>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-3xl border border-border bg-card p-5 lg:col-span-2"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary"><MessageCircle className="h-5 w-5" /></span><div><h3 className="font-display text-lg font-bold">WhatsApp da loja</h3><p className="text-sm text-muted-foreground">Número usado nos botões de WhatsApp dos produtos.</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"><input value={settings.whatsapp_phone} onChange={e=>setSettings({...settings,whatsapp_phone:e.target.value})} placeholder="5594992989833" inputMode="tel" className="rounded-xl border border-border bg-background px-4 py-3 font-mono" /><button onClick={()=>void saveSettings()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar número"}</button></div><p className="mt-2 text-xs text-muted-foreground">Use DDI + DDD + número. Ex.: 5594992989833.</p></div>
      <div className="rounded-3xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">Resumo da vitrine</p><div className="mt-3 space-y-2 text-sm"><p><b>{offerCount}</b> produto(s) em oferta</p><p><b>{featuredCount}</b> produto(s) em destaque</p><p><b>{products.filter(p=>p.status==="active").length}</b> publicado(s)</p></div></div>
    </div>

    <div className="rounded-3xl border border-border bg-card p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-lg font-bold">Configuração da vitrine</h3><p className="text-sm text-muted-foreground">Defina se Ofertas e Destaques aparecem e quantos produtos cada seção mostra.</p></div><button onClick={()=>void saveSettings()} disabled={saving} className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary"><Save className="h-4 w-4" /> Salvar</button></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border p-4"><label className="flex items-center justify-between gap-3"><span><b>Ofertas</b><span className="block text-xs text-muted-foreground">Produtos com preço promocional.</span></span><input type="checkbox" checked={settings.offers_enabled} onChange={e=>setSettings({...settings,offers_enabled:e.target.checked})} /></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><input value={settings.offers_title} onChange={e=>setSettings({...settings,offers_title:e.target.value})} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /><input type="number" min="1" max="24" value={settings.offers_limit} onChange={e=>setSettings({...settings,offers_limit:Number(e.target.value)})} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /></div><textarea value={settings.offers_subtitle} onChange={e=>setSettings({...settings,offers_subtitle:e.target.value})} rows={2} placeholder="Subtítulo (opcional)" className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /></div>
        <div className="rounded-2xl border border-border p-4"><label className="flex items-center justify-between gap-3"><span><b>Destaques da vitrine</b><span className="block text-xs text-muted-foreground">Produtos marcados manualmente.</span></span><input type="checkbox" checked={settings.featured_enabled} onChange={e=>setSettings({...settings,featured_enabled:e.target.checked})} /></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><input value={settings.featured_title} onChange={e=>setSettings({...settings,featured_title:e.target.value})} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /><input type="number" min="1" max="24" value={settings.featured_limit} onChange={e=>setSettings({...settings,featured_limit:Number(e.target.value)})} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /></div><textarea value={settings.featured_subtitle} onChange={e=>setSettings({...settings,featured_subtitle:e.target.value})} rows={2} placeholder="Subtítulo (opcional)" className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /></div>
      </div></div>

    <div className="rounded-3xl border border-border bg-card p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h3 className="font-display text-lg font-bold">Produtos, ofertas e organização</h3><p className="text-sm text-muted-foreground">Defina preço de oferta, destaque, ordem e publicação.</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>setOnlyOffers(!onlyOffers)} className="rounded-full border border-border px-3 py-2 text-xs font-semibold"><Tag className="mr-1 inline h-3.5 w-3.5" /> Ofertas</button><button onClick={()=>setOnlyFeatured(!onlyFeatured)} className="rounded-full border border-border px-3 py-2 text-xs font-semibold"><Star className="mr-1 inline h-3.5 w-3.5" /> Destaques</button></div></div>
      <div className="mt-4 relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto, código ou marca" className="w-full rounded-xl border border-border bg-background px-10 py-3 text-sm" /></div>
      <div className="mt-5 space-y-3">{visibleProducts.length===0 ? <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</div> : visibleProducts.map(product => { const inputId="offer-"+product.id; return <article key={product.id} className="rounded-2xl border border-border p-4"><div className="flex flex-col gap-4 xl:flex-row xl:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{product.name}</h4><span className="font-mono text-xs text-muted-foreground">{product.product_code}</span><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{product.status==="active" ? "Publicado" : "Oculto"}</span></div><p className="mt-1 text-xs text-muted-foreground">{brands[product.brand_id ?? ""] ?? "Sem marca"} · {categories[product.category_id ?? ""] ?? "Sem categoria"} · Estoque: {product.stock}</p><p className="mt-2 text-sm">Original: <b>{brl(product.price)}</b>{product.promotional_price!=null && <> · Oferta: <b className="text-primary">{brl(product.promotional_price)}</b></>}</p></div>
        <div className="grid gap-2 sm:grid-cols-2 xl:w-[410px]"><div className="flex gap-2"><input id={inputId} type="number" min="0.01" max={product.price-0.01} step="0.01" defaultValue={product.promotional_price ?? ""} placeholder="Preço de oferta" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" /><button title="Salvar oferta" onClick={()=>{ const el=document.getElementById(inputId) as HTMLInputElement|null; void setOffer(product,el?.value ?? ""); }} className="rounded-xl border border-primary/30 p-2 text-primary"><Save className="h-4 w-4" /></button>{product.promotional_price!=null && <button title="Remover oferta" onClick={()=>void setOffer(product,"")} className="rounded-xl border p-2"><X className="h-4 w-4" /></button>}</div><div className="flex gap-2"><button onClick={()=>void toggleFeatured(product)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold"><Star className="h-3.5 w-3.5" /> {product.catalog_featured ? "Em destaque" : "Destacar"}</button>{product.catalog_featured && <><button title="Subir" onClick={()=>void moveFeatured(product,-1)} className="rounded-xl border p-2"><ChevronUp className="h-4 w-4" /></button><button title="Descer" onClick={()=>void moveFeatured(product,1)} className="rounded-xl border p-2"><ChevronDown className="h-4 w-4" /></button></>}<button title={product.status==="active" ? "Ocultar" : "Publicar"} onClick={()=>void toggleStatus(product)} className="rounded-xl border p-2">{product.status==="active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div></div></article>; })}</div>
    </div>
    <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 text-sm text-muted-foreground"><p className="font-semibold text-foreground">Como a vitrine funciona</p><p className="mt-1">Preço promocional cria a oferta. Destaque fixa o produto na seção de destaques e os botões de subir/descer controlam a ordem. O WhatsApp dos cards usa o número salvo acima.</p></div>
  </section>;
}