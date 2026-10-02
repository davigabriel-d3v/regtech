import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Award,
  Bike,
  Check,
  ChevronDown,
  LayoutGrid,
  MapPin,
  Menu,
  Package,
  Plane,
  SatelliteDish,
  Search,
  Smartphone,
  Tv,
  Watch,
  X,
} from "lucide-react";
import { ContaBotao } from "@/components/ContaBotao";
import {
  BannerPrincipal,
  BannersSecundarios,
  Beneficios,
  CompreCategoria,
  MarcasSecao,
  NavCategorias,
  Newsletter,
  OfertasDoDia,
  ProdutoCarrossel,
  grupos,
  ProdutoCardLoja,
} from "@/components/loja/Secoes";
import logo from "@/assets/regtech-logo.png";
import { listarMarcas, listarProdutos, type ProdutoLoja } from "@/lib/produtos.functions";
import { listarBanners } from "@/lib/banners.functions";
import type { BannerPrincipal as BannerPrincipalData } from "@/lib/banners";
import { whatsappComMensagem } from "@/lib/contato";

export const lojaProdutosQueryOptions = queryOptions({
  queryKey: ["loja", "produtos"],
  queryFn: async () => (await listarProdutos().catch(() => null)) ?? [],
});

export const lojaMarcasQueryOptions = queryOptions({
  queryKey: ["loja", "marcas"],
  queryFn: async () => (await listarMarcas().catch(() => null)) ?? [],
});

export const lojaBannersQueryOptions = queryOptions({
  queryKey: ["loja", "banners"],
  queryFn: async () => (await listarBanners().catch(() => null)) ?? [],
});


export const Route = createFileRoute("/shop")({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(lojaProdutosQueryOptions),
      queryClient.ensureQueryData(lojaMarcasQueryOptions),
      queryClient.ensureQueryData(lojaBannersQueryOptions),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Shop RegTech — Motos Elétricas, Starlink, Apple, Xiaomi e mais" },
      {
        name: "description",
        content:
          "Catálogo da RegTech: motos elétricas, Starlink, Apple, Realme, DJI, Xiaomi, Samsung e acessórios, com instalação e suporte em Tucumã-PA e Ourilândia-PA.",
      },
      {
        property: "og:title",
        content: "Shop RegTech — Motos Elétricas, Starlink, Apple, Xiaomi e mais",
      },
      {
        property: "og:description",
        content:
          "Veja os produtos e marcas que a RegTech trabalha, com configuração, instalação e suporte local em Tucumã-PA e Ourilândia-PA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

const categorias = [
  { slug: "motos-eletricas", nome: "Motos Elétricas", icon: Bike },
  { slug: "starlink", nome: "Starlink", icon: SatelliteDish },
  { slug: "apple", nome: "Apple", icon: Apple },
  { slug: "realme", nome: "Realme", icon: Smartphone },
  { slug: "dji", nome: "DJI", icon: Plane },
  { slug: "xiaomi", nome: "Xiaomi", icon: Watch },
  { slug: "samsung", nome: "Samsung", icon: Tv },
  { slug: "acessorios", nome: "Acessórios", icon: Package },
];

function nomeCategoria(slug: string): string {
  return categorias.find((c) => c.slug === slug)?.nome ?? slug;
}

function iconeCategoria(slug: string) {
  return categorias.find((c) => c.slug === slug)?.icon ?? Package;
}

function precoTexto(preco: number | null): string {
  if (preco === null) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(preco);
}

function Shop() {
  const { data: produtos } = useSuspenseQuery(lojaProdutosQueryOptions);
  const { data: marcas } = useSuspenseQuery(lojaMarcasQueryOptions);
  const { data: banners } = useSuspenseQuery(lojaBannersQueryOptions);
  const ofertas = useMemo(() => {
    const d = produtos.filter((p) => p.destaque);
    return d.length >= 4 ? d : [...d, ...produtos.filter((p) => !p.destaque)];
  }, [produtos]);
  const maisVendidos = useMemo(() => [...produtos].sort((a, b) => b.avaliacoes - a.avaliacoes).slice(0, 10), [produtos]);
  const amar = useMemo(() => [...produtos].sort((a, b) => a.avaliacoes - b.avaliacoes).slice(0, 10), [produtos]);
  const blocos = useMemo(
    () =>
      [
        { chave: "celulares", titulo: "Smartphones" },
        { chave: "informatica", titulo: "Informática e conectividade" },
        { chave: "acessorios", titulo: "Acessórios" },
        { chave: "eletronicos", titulo: "Casa e Eletrônicos" },
      ].map((b) => ({ ...b, produtos: produtos.filter((p) => (grupos[b.chave] ?? []).includes(p.categoria)).slice(0, 6) })),
    [produtos],
  );
  const [filtro, setFiltro] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);

  const escolherCategoria = (slug: string) => {
    setFiltro(slug);
    setBusca("");
    setMenuAberto(false);
    requestAnimationFrame(() => {
      document
        .getElementById("produtos")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((produto) => {
      const slugs = grupos[filtro] ?? [filtro];
      const bateCategoria = filtro === "todas" || slugs.includes(produto.categoria);
      const bateBusca =
        termo === "" ||
        [produto.titulo, produto.marca, produto.descricao]
          .join(" ")
          .toLowerCase()
          .includes(termo);
      return bateCategoria && bateBusca;
    });
  }, [produtos, filtro, busca]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <CategoriasMenu
            aberto={menuAberto}
            setAberto={setMenuAberto}
            onCategoria={escolherCategoria}
          />

          <Link
            to="/shop"
            className="flex items-center gap-2 sm:gap-3"
            aria-label="Shop RegTech"
          >
            <img src={logo} alt="Logo da RegTech" className="h-9 w-9 rounded-full" />
            <span className="font-display text-lg font-bold tracking-tight">
              Reg<span className="text-primary">Tech</span>
              <span className="ml-2 rounded-full bg-primary/15 px-2.5 py-1 align-middle text-xs font-semibold text-primary">
                Shop
              </span>
            </span>
          </Link>


          <nav className="ml-auto hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <Link to="/" className="transition-colors hover:text-foreground">
              Início
            </Link>
            <Link to="/" hash="contato" className="transition-colors hover:text-foreground">
              Contato
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <ContaBotao />
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary md:ml-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar ao site</span>
          </Link>
          </div>
        </div>
      </header>

      <NavCategorias onEscolher={escolherCategoria} />
      <BannerPrincipal onEscolher={escolherCategoria} banners={banners as BannerPrincipalData[]} />
      <BannersSecundarios onEscolher={escolherCategoria} />
      <CompreCategoria onEscolher={escolherCategoria} />
      <OfertasDoDia produtos={ofertas.slice(0, 4)} />
      <ProdutoCarrossel titulo="Mais vendidos" subtitulo="Os queridinhos dos clientes RegTech" produtos={maisVendidos} />
      <Beneficios />
      <ProdutoCarrossel titulo="Ofertas que você vai amar" produtos={amar} />
      {blocos.map((b) =>
        b.produtos.length > 0 ? (
          <ProdutoCarrossel
            key={b.chave}
            titulo={b.titulo}
            produtos={b.produtos}
            onVerTodos={() => escolherCategoria(b.chave)}
          />
        ) : null,
      )}
      <MarcasSecao marcas={marcas} onMarca={(nome) => { setFiltro("todas"); setBusca(nome); document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" }); }} />

      <h2 id="todos" className="mx-auto mt-16 max-w-6xl px-4 font-display text-2xl font-bold sm:px-6">Todos os produtos</h2>
      {/* Filtros */}
      <div className="sticky top-16 z-40 mt-4 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Buscar produto</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar produto, marca ou serviço"
                className="w-full rounded-full border border-border bg-card/80 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>
            <p className="text-sm text-muted-foreground lg:w-auto">
              {visiveis.length}{" "}
              {visiveis.length === 1 ? "produto" : "produtos"}
            </p>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFiltro("todas")}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                filtro === "todas"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/80 text-foreground hover:bg-secondary"
              }`}
            >
              Todas
            </button>
            {categorias.map((categoria) => {
              const Icone = categoria.icon;
              const ativo = filtro === categoria.slug;
              return (
                <button
                  key={categoria.slug}
                  type="button"
                  onClick={() => setFiltro(categoria.slug)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    ativo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card/80 text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icone className="h-4 w-4" />
                  {categoria.nome}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grade de produtos */}
      <main id="produtos" className="mx-auto max-w-6xl scroll-mt-40 px-4 py-10 sm:px-6">
        {visiveis.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card/60 px-6 py-16 text-center">
            <p className="font-display text-xl font-bold">
              Nada encontrado por aqui
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Ajuste a busca ou escolha outra categoria. Se o que você procura não
              estiver na lista, a RegTech também consegue buscar para você.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setFiltro("todas");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              <X className="h-4 w-4" />
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visiveis.map((produto) => (
              <ProdutoCardLoja key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </main>

      <Newsletter />

      {/* Aviso e apoio */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12"
          style={{
            background:
              "radial-gradient(80% 120% at 50% 120%, var(--color-brand) 0%, var(--color-card) 70%)",
          }}
        >
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Não achou o que procurava?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Valores e disponibilidade mudam conforme o modelo e a montagem. Fale
            com a RegTech no WhatsApp e peça uma cotação — atendemos Tucumã-PA e
            Ourilândia-PA.
          </p>
          <a
            href={whatsappComMensagem(
              "Olá! Vim pela loja da RegTech e quero uma cotação.",
            )}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 hover:bg-accent"
          >
            Pedir uma cotação
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo da RegTech" className="h-8 w-8 rounded-full" />
            <span className="font-display font-bold">
              Reg<span className="text-primary">Tech</span>
            </span>
          </div>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Tucumã-PA / Ourilândia-PA · Referência em Tecnologia há +14 anos
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RegTech. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function CategoriasMenu({
  aberto,
  setAberto,
  onCategoria,
}: {
  aberto: boolean;
  setAberto: (valor: boolean) => void;
  onCategoria: (slug: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    const esc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto, setAberto]);


  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        aria-label="Categorias"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        {aberto ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span className="hidden sm:inline">Categorias</span>
        <ChevronDown
          className={`hidden h-4 w-4 transition-transform sm:inline ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <nav className="absolute left-0 top-full mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Categorias
          </p>
          <button
            type="button"
            onClick={() => onCategoria("todas")}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
          >
            <LayoutGrid className="h-4 w-4 text-primary" />
            Todas
          </button>
          {categorias.map((categoria) => {
            const Icone = categoria.icon;
            return (
              <button
                key={categoria.slug}
                type="button"
                onClick={() => onCategoria(categoria.slug)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
              >
                <Icone className="h-4 w-4 text-primary" />
                {categoria.nome}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

