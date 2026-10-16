import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  ChevronDown,
  Store,
  Bike,
  SatelliteDish,
  Apple,
  Smartphone,
  MonitorSmartphone,
  Wifi,
  Camera,
  Globe,
  Building2,
  Headset,
  Plane,
  Watch,
  Tv,
  Package,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
  Zap,
  Search,
  ShoppingCart,
  Star,
  Gift,
  ArrowUpRight,
} from "lucide-react";
import { ContaBotao } from "@/components/ContaBotao";
import { RodapeRegTech } from "@/components/RodapeRegTech";
import { CompreCategoria, grupos } from "@/components/loja/Secoes";
import { useCarrinho } from "@/components/loja/CarrinhoContext";
import { listarMarcas, listarProdutos, type ProdutoLoja } from "@/lib/produtos.functions";
import { listarBanners } from "@/lib/banners.functions";
import { listarConfiguracoesLoja } from "@/lib/loja-settings.functions";
import { DEFAULT_BANNERS, type BannerPrincipal } from "@/lib/banners";
import { DEFAULT_LOJA_SETTINGS } from "@/lib/loja-settings";
import logo from "@/assets/regtech-logo.png";

const categorias = [
  ["todas", "Todas"],
  ["celulares", "Celulares"],
  ["informatica", "Informática"],
  ["audio", "Áudio"],
  ["smartwatches", "Smartwatches"],
  ["tvs", "TVs"],
  ["acessorios", "Acessórios"],
  ["cameras", "Câmeras e drones"],
  ["conectividade", "Conectividade"],
  ["mobilidade", "Mobilidade elétrica"],
  ["eletronicos", "Eletrônicos"],
  ["apple", "Apple"],
  ["samsung", "Samsung"],
  ["xiaomi", "Xiaomi"],
  ["realme", "Realme"],
] as const;

const categoriasPorGrupo = grupos;

function brl(value: number | null) {
  if (value == null) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function estrelas(nota: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-3.5 w-3.5 ${i < Math.round(nota) ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
    />
  ));
}

export const Route = createFileRoute("/shop")({
  loader: async () => {
    const [produtos, marcas, banners, lojaSettings] = await Promise.all([
      listarProdutos().catch(() => []),
      listarMarcas().catch(() => []),
      listarBanners().catch(() => DEFAULT_BANNERS),
      listarConfiguracoesLoja().catch(() => DEFAULT_LOJA_SETTINGS),
    ]);
    return { produtos, marcas, banners, lojaSettings };
  },
  head: () => ({
    meta: [
      { title: "Shop RegTech — Tecnologia, mobilidade e conectividade" },
      { property: "og:title", content: "Shop RegTech — Tecnologia, mobilidade e conectividade" },
      { property: "og:description", content: "Compre tecnologia, motos elétricas, Starlink, Apple, Samsung, Xiaomi, DJI e acessórios na RegTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Compre tecnologia, motos elétricas, Starlink, Apple, Samsung, Xiaomi, DJI e acessórios na RegTech.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { produtos, banners, lojaSettings } = Route.useLoaderData();
  const { totalItens, adicionar, abrirCarrinho } = useCarrinho();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [menu, setMenu] = useState(false);
  const [banner, setBanner] = useState(0);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [somenteEstoque, setSomenteEstoque] = useState(false);
  const [ordenacao, setOrdenacao] = useState("destaques");

  const ativos = (banners.length ? banners : DEFAULT_BANNERS).filter((b) => b.active);
  const atual = ativos[banner] ?? ativos[0];

  // Cada banner respeita seu próprio tempo de exibição configurado no admin.
  useEffect(() => {
    if (ativos.length < 2 || !atual) return;
    const segundos = Math.max(1, Number(atual.autoplaySeconds) || 5);
    const timer = window.setTimeout(() => {
      setBanner((indice) => (indice + 1) % ativos.length);
    }, segundos * 1000);
    return () => window.clearTimeout(timer);
  }, [banner, ativos.length, atual?.id, atual?.autoplaySeconds]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const categoriasDoFiltro = categoriasPorGrupo[categoria];
      const cat =
        categoria === "todas" ||
        p.categoria === categoria ||
        (categoriasDoFiltro?.includes(p.categoria) ?? false) ||
        (categoria === "celulares" && ["apple", "samsung", "xiaomi", "realme"].includes(p.categoria));
      const texto = [p.titulo, p.marca, p.descricao, p.categoria].join(" ").toLowerCase();
      return cat && (!termo || texto.includes(termo)) && (!somenteEstoque || p.emEstoque);
    });
  }, [produtos, categoria, busca, somenteEstoque]);

  const ordenados = useMemo(() => [...filtrados].sort((a, b) => { if (ordenacao === "menor") return (a.preco ?? Infinity) - (b.preco ?? Infinity); if (ordenacao === "maior") return (b.preco ?? -Infinity) - (a.preco ?? -Infinity); if (ordenacao === "avaliacao") return b.avaliacao - a.avaliacao; return Number(b.destaque) - Number(a.destaque); }), [filtrados, ordenacao]);

  const alternarFavorito = (id: string) => {
    setFavoritos((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]));
  };

  const proximoBanner = (direcao: number) => {
    if (ativos.length < 2) return;
    setBanner((i) => (i + direcao + ativos.length) % ativos.length);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="relative">
            <button
              type="button"
              aria-label="Categorias"
              aria-expanded={menu}
              onClick={() => setMenu((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:px-4"
            >
              <LayoutGrid className="h-4 w-4 text-accent" />
              <span className="hidden sm:inline">Categorias</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${menu ? "rotate-180" : ""}`} />
            </button>
          </div>

          <Link to="/shop" className="flex items-center gap-2">
            <img src={logo} alt="RegTech" className="h-9 w-9 rounded-full" />
            <span className="font-display text-xl font-bold">
              Reg<span className="text-primary">Tech</span>
            </span>
            <span className="hidden rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary sm:inline">
              SHOP
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/carrinho"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItens > 0 && (
                <span key={totalItens} className="rt-cart-feedback absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] font-bold text-primary-foreground">
                  {totalItens > 99 ? "99+" : totalItens}
                </span>
              )}
            </Link>
            <ContaBotao />
            <Link
              to="/"
              className="hidden items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </div>
        </div>

        {menu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
            <nav className="rt-menu-enter absolute left-4 top-full z-50 mt-2 max-h-[70vh] w-60 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl shadow-primary/10 sm:left-6">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links rápidos</p>
              {[
                { label: "Início", href: "/#inicio" },
                { label: "Quem somos", href: "/#quem-somos" },
                { label: "Serviços", href: "/#servicos" },
                { label: "Contato", href: "/#contato" },
                { label: "Resgatar", href: "/resgatar" },
              ].map((link) => link.label === "Resgatar" ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenu(false)}
                  className="group/resgatar relative my-2 flex items-center justify-between overflow-hidden rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-cyan-400/10 px-3 py-3 text-sm font-bold text-emerald-300 shadow-md shadow-emerald-950/20 ring-1 ring-emerald-400/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:from-emerald-500/30 hover:to-cyan-400/20 hover:shadow-lg hover:shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/20 text-emerald-300 transition-transform duration-200 group-hover/resgatar:scale-110">
                      <Gift className="h-5 w-5" />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span>Resgatar</span>
                      <span className="text-[11px] font-medium text-emerald-100/70">Seus cupons e benefícios</span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-300 transition-transform duration-200 group-hover/resgatar:translate-x-0.5 group-hover/resgatar:-translate-y-0.5" />
                </a>
              ) : (
                <a key={link.href} href={link.href} onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/15 hover:text-primary">
                  {link.label}
                </a>
              ))}
              <Link to="/shop" onClick={() => setMenu(false)} className="mt-1 flex items-center gap-2.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20">
                <Store className="h-4 w-4" /> Shop RegTech
              </Link>
              <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categorias</p>
              {[
                { icon: MonitorSmartphone, slug: "assistencia-tecnica", title: "Assistência Técnica" },
                { icon: Wifi, slug: "redes-e-internet", title: "Redes e Internet" },
                { icon: Camera, slug: "cameras-e-seguranca", title: "Câmeras e Segurança" },
                { icon: Globe, slug: "sites-e-sistemas", title: "Sites e Sistemas" },
                { icon: Building2, slug: "suporte-empresarial", title: "Suporte Empresarial" },
                { icon: Headset, slug: "atendimento-local", title: "Atendimento Local" },
              ].map((item) => (
                <a key={item.slug} href={`/#${item.slug}`} onClick={() => setMenu(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/15 hover:text-primary">
                  <item.icon className="h-4 w-4 text-primary" /> {item.title}
                </a>
              ))}
              <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produtos e marcas</p>
              {[
                { icon: Bike, slug: "motos-eletricas", title: "Motos Elétricas" },
                { icon: SatelliteDish, slug: "starlink", title: "Starlink" },
                { icon: Apple, slug: "apple", title: "Apple" },
                { icon: Smartphone, slug: "realme", title: "Realme" },
                { icon: Plane, slug: "dji", title: "DJI" },
                { icon: Watch, slug: "xiaomi", title: "Xiaomi" },
                { icon: Tv, slug: "samsung", title: "Samsung" },
              ].map((item) => (
                <a key={item.slug} href={`/#${item.slug}`} onClick={() => setMenu(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/15 hover:text-primary">
                  <item.icon className="h-4 w-4 text-primary" /> {item.title}
                </a>
              ))}
            </nav>
          </>
        )}
      </header>

      <main>
        {atual && (
          <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
            <div key={atual.id} className="rt-banner-enter group relative min-h-[300px] overflow-hidden rounded-3xl border border-primary/25 bg-[#071b46] shadow-xl shadow-blue-950/15 sm:min-h-[380px]">
              <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, #061536 0%, ${atual.backgroundColor || "#073b8c"} 48%, #0879c9 78%, #12b8d5 120%)` }} />
              {(atual.backgroundImageUrl || atual.backgroundMobileImageUrl) && (
                <picture className="absolute inset-0">
                  {atual.backgroundMobileImageUrl && <source media="(max-width: 639px)" srcSet={atual.backgroundMobileImageUrl} />}
                  <img
                    src={atual.backgroundImageUrl || atual.backgroundMobileImageUrl || ""}
                    alt=""
                    className="h-full w-full object-cover opacity-55 mix-blend-screen transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </picture>
              )}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_25%,rgba(56,189,248,.42),transparent_38%),linear-gradient(90deg,rgba(2,12,36,.82)_0%,rgba(3,28,71,.52)_52%,rgba(3,25,55,.18)_100%)]" />
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: Math.max(0.04, Math.min(0.28, Number(atual.overlayOpacity ?? 0.12) * 0.45)) }}
              />
              <div className="relative z-10 flex min-h-[300px] max-w-2xl items-center px-7 py-10 sm:min-h-[380px] sm:px-14">
                <div className="text-white">
                  {atual.badge && (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                      {atual.badge}
                    </span>
                  )}
                  <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
                    {atual.title}
                  </h1>
                  {atual.subtitle && <p className="mt-4 max-w-xl text-white/80 sm:text-lg">{atual.subtitle}</p>}
                  {atual.buttonLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        if (atual.actionType === "url" && atual.actionValue) window.open(atual.actionValue, "_blank");
                        else document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-accent"
                    >
                      {atual.buttonLabel}
                    </button>
                  )}
                </div>
              </div>
              {ativos.length > 1 && (
                <>
                  <button type="button" onClick={() => proximoBanner(-1)} className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/70">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => proximoBanner(1)} className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/70">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:px-6">
          {[
            ["Entrega e suporte", "Atendimento local RegTech"],
            ["Pagamento", "Pix, cartão e condições"],
            ["Instalação", "Configuração especializada"],
            ["Compra segura", "Suporte antes e depois"],
          ].map(([titulo, texto]) => (
            <div key={titulo} className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="font-semibold">{titulo}</p>
              <p className="mt-1 text-xs text-muted-foreground">{texto}</p>
            </div>
          ))}
        </section>

        <CompreCategoria
          onEscolher={(chave) => {
            setCategoria(chave);
            document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        <section id="produtos" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-primary">CATÁLOGO REGTECH</p>
              <h2 className="font-display text-3xl font-bold">Encontre seu próximo upgrade</h2>
            </div>
            <label className="relative md:ml-auto md:w-[380px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto, marca..."
                className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {categorias.map(([id, nome]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategoria(id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${categoria === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}
              >
                {nome}
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {ordenados.length} {ordenados.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
            {(busca || categoria !== "todas") && (
              <button type="button" onClick={() => { setBusca(""); setCategoria("todas"); }} className="text-sm font-semibold text-primary">
                Limpar filtros
              </button>
            )}
          </div>

          {filtrados.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-border bg-card p-14 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-display text-xl font-bold">Nenhum produto encontrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">Tente outra busca ou categoria.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {ordenados.map((produto) => {
                const fav = favoritos.includes(produto.id);
                const desconto =
                  produto.preco && produto.precoAntigo && produto.precoAntigo > produto.preco
                    ? Math.round((1 - produto.preco / produto.precoAntigo) * 100)
                    : null;
                return (
                  <article data-motion="product" key={produto.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5">
                    <div className="relative aspect-square overflow-hidden bg-secondary">
                      {produto.imagemUrl ? (
                        <img src={produto.imagemUrl} alt={produto.titulo} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="grid h-full place-items-center"><Package className="h-12 w-12 text-muted-foreground" /></div>
                      )}
                      {desconto && <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-1 text-[11px] font-bold text-destructive-foreground">-{desconto}%</span>}
                      <button type="button" onClick={() => alternarFavorito(produto.id)} aria-label="Favoritar" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur">
                        <Heart className={`h-4 w-4 ${fav ? "fill-destructive text-destructive" : ""}`} />
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{produto.marca}</p>
                      <Link to="/produto/$productCode" params={{ productCode: produto.productCode }} className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold hover:text-primary">
                        {produto.titulo}
                      </Link>
                      <div className="mt-2 flex items-center gap-1">
                        <span className="flex">{estrelas(produto.avaliacao)}</span>
                        <span className="text-[11px] text-muted-foreground">{produto.avaliacao.toFixed(1)} ({produto.avaliacoes})</span>
                      </div>
                      <div className="mt-3 flex-1">
                        {produto.precoAntigo && produto.preco && produto.precoAntigo > produto.preco && (
                          <p className="text-xs text-muted-foreground line-through">{brl(produto.precoAntigo)}</p>
                        )}
                        <p className="font-display text-xl font-bold text-primary">{brl(produto.preco)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (produto.preco != null && produto.emEstoque) {
                            adicionar(produto);
                            abrirCarrinho();
                          } else {
                            window.open(`https://wa.me/${lojaSettings.whatsappPhone}?text=${encodeURIComponent(`Olá! Quero solicitar: ${produto.titulo}`)}`, "_blank");
                          }
                        }}
                        className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-accent active:scale-[.98]"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {produto.preco != null && produto.emEstoque ? "Adicionar ao carrinho" : "Solicitar pedido"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
            <p className="text-sm font-bold text-primary">PRECISA DE AJUDA?</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Não encontrou o que procura?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Fale com a RegTech e peça uma cotação. Nossa equipe ajuda a encontrar o modelo certo e orientar instalação e configuração.
            </p>
            <a
              href={`https://wa.me/${lojaSettings.whatsappPhone}?text=${encodeURIComponent("Olá! Vim pela Shop RegTech e quero uma cotação.")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground hover:bg-accent"
            >
              Falar no WhatsApp
            </a>
          </div>
        </section>
      </main>

      <RodapeRegTech />
    </div>
  );
}
