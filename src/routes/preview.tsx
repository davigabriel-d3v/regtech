import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Bike, ChevronRight, Heart, Menu, Package, Search,
  SatelliteDish, ShoppingCart, Smartphone, Star, Tv, Watch, X,
} from "lucide-react";
import { RodapeRegTech } from "@/components/RodapeRegTech";
import logo from "@/assets/regtech-logo.png";

export const Route = createFileRoute("/preview")({
  head: () => ({ meta: [
    { title: "Preview — RegTech Shop" },
    { name: "description", content: "Prévia visual do novo Shop RegTech com catálogo demonstrativo." },
  ]}),
  component: Preview,
});

type DemoProduct = { id: number; name: string; category: string; price: number; oldPrice?: number; image: string; rating: number; reviews: number; badge?: string };

const products: DemoProduct[] = [
  { id: 1, name: "iPhone 16 Pro 128GB", category: "Apple", price: 7499, oldPrice: 7999, image: "https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=900&q=85", rating: 4.9, reviews: 128, badge: "Oferta" },
  { id: 2, name: "Xiaomi Redmi Note 14 Pro", category: "Xiaomi", price: 1899, oldPrice: 2199, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=85", rating: 4.8, reviews: 94, badge: "Mais vendido" },
  { id: 3, name: "Starlink Mini", category: "Starlink", price: 2499, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85", rating: 4.9, reviews: 76, badge: "Destaque" },
  { id: 4, name: "Moto Elétrica Urban 3000W", category: "Motos Elétricas", price: 12990, oldPrice: 13990, image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85", rating: 4.9, reviews: 61, badge: "Oferta" },
  { id: 5, name: "DJI Mini 4 Pro Fly More", category: "DJI", price: 8990, oldPrice: 9490, image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=85", rating: 4.8, reviews: 43, badge: "Destaque" },
  { id: 6, name: "Apple Watch Series 10", category: "Apple", price: 4299, oldPrice: 4699, image: "https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&w=900&q=85", rating: 4.8, reviews: 82, badge: "Novo" },
  { id: 7, name: "Samsung Galaxy S25 Ultra", category: "Samsung", price: 6999, oldPrice: 7499, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=85", rating: 4.9, reviews: 113, badge: "Top" },
  { id: 8, name: "Realme GT 7 Pro", category: "Realme", price: 3999, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85", rating: 4.7, reviews: 57 },
  { id: 9, name: "Fone AirPods Pro 2", category: "Acessórios", price: 1899, oldPrice: 2199, image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85", rating: 4.8, reviews: 145, badge: "Oferta" },
  { id: 10, name: 'Smart TV 55" 4K', category: "Eletrônicos", price: 3299, oldPrice: 3799, image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=85", rating: 4.6, reviews: 39 },
  { id: 11, name: "Xiaomi Watch 2 Pro", category: "Xiaomi", price: 1699, oldPrice: 1899, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85", rating: 4.7, reviews: 64 },
  { id: 12, name: "Kit Câmeras DJI Osmo", category: "DJI", price: 2999, image: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=900&q=85", rating: 4.8, reviews: 31 },
];

const categories = [
  { name: "Motos Elétricas", icon: Bike }, { name: "Starlink", icon: SatelliteDish },
  { name: "Apple", icon: Smartphone }, { name: "Xiaomi", icon: Watch },
  { name: "Samsung", icon: Smartphone }, { name: "Acessórios", icon: Package },
  { name: "Eletrônicos", icon: Tv },
];

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value);
}

function Preview() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState(0);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => (category === "Todos" || product.category === category) && (!term || product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term)));
  }, [category, search]);
  const toggleFavorite = (id: number) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-primary px-4 py-2 text-center text-xs font-semibold text-primary-foreground">PREVIEW VISUAL • Catálogo demonstrativo • Os preços e produtos abaixo são ilustrativos</div>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => setMenu(!menu)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary" aria-label="Abrir menu">{menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          <Link to="/preview" className="flex items-center gap-2.5"><img src={logo} alt="RegTech" className="h-10 w-10 rounded-full" /><div className="hidden sm:block"><div className="font-display text-lg font-black tracking-tight">Reg<span className="text-primary">Tech</span></div><div className="-mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">tecnologia que faz avançar</div></div></Link>
          <div className="relative ml-auto hidden max-w-xl flex-1 md:block"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busque por produto, marca ou categoria..." className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-5 text-sm outline-none focus:border-primary" /></div>
          <Link to="/carrinho" className="relative ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary md:ml-0" aria-label="Carrinho"><ShoppingCart className="h-4 w-4" />{cart > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{cart}</span>}</Link>
        </div>
        {menu && <div className="border-t border-border bg-card"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-4 sm:grid-cols-4 sm:px-6 lg:grid-cols-7">{categories.map((item) => { const Icon = item.icon; return <button key={item.name} type="button" onClick={() => { setCategory(item.name); setMenu(false); }} className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-secondary"><Icon className="h-4 w-4 text-primary" />{item.name}</button>; })}</div></div>}
      </header>

      <section className="relative overflow-hidden"><div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6"><div className="relative min-h-[390px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-primary/40">
        <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1800&q=90" alt="Tecnologia RegTech" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-transparent" />
        <div className="relative flex min-h-[390px] max-w-2xl flex-col justify-center px-7 py-14 sm:px-12"><span className="mb-4 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">Preview da nova experiência</span><h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-6xl">Tecnologia que<span className="block text-primary">faz avançar.</span></h1><p className="mt-5 max-w-lg text-base leading-7 text-white/75 sm:text-lg">Smartphones, conectividade, mobilidade elétrica, drones e acessórios em um só lugar.</p><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-xl shadow-primary/20 hover:bg-accent">Ver catálogo <ArrowRight className="h-4 w-4" /></button><Link to="/" className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-6 py-3 font-bold text-white hover:bg-white/15">Conhecer a RegTech</Link></div></div>
      </div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="grid gap-3 sm:grid-cols-3">{[["Entrega e suporte local", "Tucumã e região"], ["Pagamento facilitado", "Consulte condições"], ["Atendimento RegTech", "Suporte de verdade"]].map(([title, subtitle]) => <div key={title} className="rounded-2xl border border-border bg-card p-5"><p className="font-bold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>)}</div></section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.15em] text-primary">Explore</p><h2 className="mt-1 font-display text-2xl font-black sm:text-3xl">Categorias em destaque</h2></div><button type="button" onClick={() => setCategory("Todos")} className="hidden text-sm font-semibold text-primary sm:block">Ver tudo</button></div><div className="mt-5 flex gap-3 overflow-x-auto pb-2">{["Todos", ...categories.map((item) => item.name)].map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-bold transition-colors ${category === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>{item}</button>)}</div></section>

      <section id="catalogo" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-12 sm:px-6"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.15em] text-primary">Catálogo</p><h2 className="mt-1 font-display text-2xl font-black sm:text-3xl">Produtos em destaque</h2><p className="mt-2 text-sm text-muted-foreground">{filtered.length} produtos demonstrativos</p></div><button type="button" onClick={() => { setSearch(""); setCategory("Todos"); }} className="hidden items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground sm:flex">Limpar filtros <ChevronRight className="h-4 w-4" /></button></div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{filtered.map((product) => { const liked = favorites.includes(product.id); return <article key={product.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-square overflow-hidden bg-secondary"><img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />{product.badge && <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-primary-foreground">{product.badge}</span>}<button type="button" onClick={() => toggleFavorite(product.id)} className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur" aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}><Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} /></button></div><div className="p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{product.category}</p><h3 className="mt-1 min-h-10 text-sm font-bold leading-5 sm:text-base">{product.name}</h3><div className="mt-2 flex items-center gap-1 text-xs"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /><span className="font-bold">{product.rating}</span><span className="text-muted-foreground">({product.reviews})</span></div><div className="mt-4">{product.oldPrice && <p className="text-xs text-muted-foreground line-through">{money(product.oldPrice)}</p>}<p className="text-lg font-black sm:text-xl">{money(product.price)}</p></div><button type="button" onClick={() => setCart((current) => current + 1)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-accent sm:text-sm"><ShoppingCart className="h-4 w-4" />Adicionar ao carrinho</button></div></article>; })}</div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6"><div className="overflow-hidden rounded-[2rem] bg-card"><div className="grid lg:grid-cols-2"><div className="relative min-h-72"><img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85" alt="Mobilidade elétrica" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-black/35" /></div><div className="flex flex-col justify-center p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-[0.15em] text-primary">RegTech Motors</p><h2 className="mt-2 font-display text-3xl font-black">Mobilidade elétrica para a sua rotina.</h2><p className="mt-4 text-muted-foreground">Um espaço para motos elétricas, equipamentos e soluções de mobilidade com atendimento local.</p><a href="https://wa.me/5594992989833?text=Ol%C3%A1!%20Vim%20pela%20preview%20da%20RegTech%20e%20quero%20saber%20mais." target="_blank" rel="noreferrer" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-accent">Falar com a RegTech <ArrowRight className="h-4 w-4" /></a></div></div></div></section>

      <RodapeRegTech />
    </div>
  );
}
