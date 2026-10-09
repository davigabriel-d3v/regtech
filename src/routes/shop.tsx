import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Package,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
  Zap,
  Search,
  ShoppingCart,
  Star,
  X,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Camera,
  Plug,
  SatelliteDish,
  Bike,
  Plane,
  Tv,
} from "lucide-react";
import { ContaBotao } from "@/components/ContaBotao";
import { RodapeRegTech } from "@/components/RodapeRegTech";
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

const categoriasVisuais = [
  { id: "celulares", nome: "Celulares", descricao: "Smartphones e marcas", icone: Smartphone },
  { id: "informatica", nome: "Informática", descricao: "Computadores e notebooks", icone: Laptop },
  { id: "audio", nome: "Áudio", descricao: "Fones e acessórios de som", icone: Headphones },
  { id: "smartwatches", nome: "Smartwatches", descricao: "Relógios inteligentes", icone: Watch },
  { id: "tvs", nome: "TVs e telas", descricao: "Entretenimento e imagem", icone: Tv },
  { id: "acessorios", nome: "Acessórios", descricao: "Capas, cabos e mais", icone: Plug },
  { id: "cameras", nome: "Câmeras e drones", descricao: "Imagem e captura aérea", icone: Camera },
  { id: "conectividade", nome: "Conectividade", descricao: "Internet e Starlink", icone: SatelliteDish },
  { id: "mobilidade", nome: "Mobilidade elétrica", descricao: "Motos elétricas", icone: Bike },
  { id: "eletronicos", nome: "Eletrônicos", descricao: "Tecnologia para seu dia", icone: Plane },
] as const;

const categoriasPorGrupo: Record<string, string[]> = {
  celulares: ["celulares", "apple", "samsung", "xiaomi", "realme"],
  informatica: ["informatica"],
  audio: ["acessorios", "audio"],
  smartwatches: ["smartwatches", "xiaomi", "apple"],
  tvs: ["tvs", "samsung"],
  acessorios: ["acessorios"],
  cameras: ["cameras", "dji"],
  conectividade: ["starlink", "informatica"],
  mobilidade: ["motos-eletricas"],
  eletronicos: ["eletronicos", "dji", "motos-eletricas"],
};

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
          <button
            type="button"
            onClick={() => setMenu(!menu)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
            aria-label="Abrir categorias"
          >
            {menu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="hidden sm:inline">Categorias</span>
          </button>

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
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1 text-center text-[10px] font-bold text-primary-foreground">
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
          <div className="border-t border-border bg-card">
            <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-3 sm:px-6">
              {categorias.map(([id, nome]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setCategoria(id);
                    setMenu(false);
                    document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${categoria === id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                >
                  {nome}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main>
        {atual && (
          <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
            <div className="group relative min-h-[300px] overflow-hidden rounded-3xl border border-primary/25 bg-[#071b46] shadow-xl shadow-blue-950/15 sm:min-h-[380px]">
              <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, #061536 0%, ${atual.backgroundColor || "#073b8c"} 48%, #0879c9 78%, #12b8d5 120%)` }} />
              {atual.backgroundImageUrl && (
                <img
                  src={atual.backgroundImageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-screen transition-transform duration-700 group-hover:scale-[1.02]"
                />
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

        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">Explore a Shop</p>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Compre por categoria</h2>
              <p className="mt-2 text-sm text-muted-foreground">Encontre rapidamente o tipo de produto que você procura.</p>
            </div>
            <button
              type="button"
              onClick={() => { setCategoria("todas"); document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" }); }}
              className="text-sm font-semibold text-primary transition-colors hover:underline"
            >
              Ver todos os produtos
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categoriasVisuais.map((item) => {
              const IconeCategoria = item.icone;
              const selecionada = categoria === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setCategoria(item.id); document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" }); }}
                  aria-pressed={selecionada}
                  className={`group flex min-h-36 flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 ${selecionada ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border bg-card/70 hover:border-primary/60"}`}
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-xl transition-colors ${selecionada ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"}`}>
                    <IconeCategoria className="h-6 w-6" />
                  </span>
                  <span className="mt-3 font-semibold">{item.nome}</span>
                  <span className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.descricao}</span>
                </button>
              );
            })}
          </div>
        </section>

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
                  <article key={produto.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5">
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
