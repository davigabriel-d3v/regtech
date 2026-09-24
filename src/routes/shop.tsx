import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Award,
  Bike,
  Check,
  MapPin,
  Package,
  Plane,
  SatelliteDish,
  Search,
  Smartphone,
  Tv,
  Watch,
  X,
} from "lucide-react";
import logo from "@/assets/regtech-logo.png";
import { listarProdutos, type ProdutoLoja } from "@/lib/produtos.functions";
import { whatsappComMensagem } from "@/lib/contato";

export const lojaProdutosQueryOptions = queryOptions({
  queryKey: ["loja", "produtos"],
  queryFn: () => listarProdutos(),
});

export const Route = createFileRoute("/shop")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(lojaProdutosQueryOptions);
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
  const [filtro, setFiltro] = useState<string>("todas");
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((produto) => {
      const bateCategoria = filtro === "todas" || produto.categoria === filtro;
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
            <Link to="/" hash="quem-somos" className="transition-colors hover:text-foreground">
              Quem somos
            </Link>
            <Link to="/" hash="servicos" className="transition-colors hover:text-foreground">
              Serviços
            </Link>
            <Link to="/" hash="contato" className="transition-colors hover:text-foreground">
              Contato
            </Link>
          </nav>

          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary md:ml-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar ao site</span>
          </Link>
        </div>
      </header>

      {/* Faixa de abertura */}
      <section
        className="relative overflow-hidden border-b border-border/60"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, var(--color-brand) 0%, transparent 65%)",
        }}
      >
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-14 text-center sm:px-6">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium text-foreground">
            <Award className="h-4 w-4 text-accent" />
            Referência em Tecnologia há +14 anos!
          </span>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            A loja da <span className="text-primary">RegTech</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Produtos e marcas que trabalhamos, com configuração, instalação e
            suporte de quem atende você pessoalmente.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            Tucumã-PA / Ourilândia-PA
          </span>
        </div>
      </section>

      {/* Filtros */}
      <div className="sticky top-16 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
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
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visiveis.map((produto) => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </main>

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

function ProdutoCard({ produto }: { produto: ProdutoLoja }) {
  const Icone = iconeCategoria(produto.categoria);

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card/70 p-5 transition-colors hover:border-primary/60">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          <Icone className="h-3.5 w-3.5 text-primary" />
          {produto.marca}
        </span>
        {produto.emEstoque ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
            <Check className="h-3.5 w-3.5" />
            Disponível
          </span>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            Sob encomenda
          </span>
        )}
      </div>

      <h3 className="mt-4 font-display text-lg font-bold leading-snug">
        {produto.titulo}
      </h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">
        {produto.descricao || nomeCategoria(produto.categoria)}
      </p>

      <p className="mt-4 text-sm font-semibold text-primary">
        {precoTexto(produto.preco)}
      </p>

      <a
        href={whatsappComMensagem(
          `Olá! Tenho interesse em: ${produto.titulo} (${produto.marca}). Pode me passar valores e prazos?`,
        )}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent"
      >
        Pedir pelo WhatsApp
        <ArrowRight className="h-4 w-4" />
      </a>
    </article>
  );
}
