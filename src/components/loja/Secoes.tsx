import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gamepad2,
  Headphones,
  Heart,
  Home,
  Laptop,
  Lock,
  Mail,
  MessageCircle,
  Package,
  Plane,
  Plug,
  SatelliteDish,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Timer,
  Truck,
  Tv,
  Watch,
  Zap,
  Bike,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { whatsappComMensagem } from "@/lib/contato";
import { SolicitarPedidoModal } from "@/components/loja/SolicitarPedidoModal";
import { useCarrinho } from "@/components/loja/CarrinhoContext";
import type { MarcaLoja, ProdutoLoja } from "@/lib/produtos.functions";
import { DEFAULT_BANNERS, type BannerPrincipal } from "@/lib/banners";

type Icone = ComponentType<{ className?: string }>;
type Escolher = (chave: string) => void;

/** Grupos de categorias da loja → categorias reais dos produtos. */
export const grupos: Record<string, string[]> = {
  celulares: ["celulares", "apple", "samsung", "xiaomi", "realme"],
  informatica: ["informatica", "starlink"],
  eletronicos: ["eletronicos", "dji", "motos-eletricas"],
  acessorios: ["acessorios"],
  audio: ["acessorios"],
  smartwatches: ["xiaomi", "apple"],
  cameras: ["dji"],
  casa: [],
  eletrodomesticos: [],
  games: [],
  tvs: ["samsung"],
};

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function irPara(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- 1. Segunda linha de navegação ---------------- */
const navItens = [
  { chave: "ofertas", nome: "Ofertas" },
  { chave: "celulares", nome: "Celulares" },
  { chave: "informatica", nome: "Informática" },
  { chave: "eletronicos", nome: "Eletrônicos" },
  { chave: "acessorios", nome: "Acessórios" },
  { chave: "casa", nome: "Casa" },
  { chave: "eletrodomesticos", nome: "Eletrodomésticos" },
  { chave: "games", nome: "Games" },
  { chave: "todas", nome: "Mais categorias" },
];

export function NavCategorias({ onEscolher }: { onEscolher: Escolher }) {
  return (
    <nav className="border-b border-border/60 bg-card/40">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 text-sm sm:px-6">
        {navItens.map((i) => (
          <button
            key={i.chave}
            type="button"
            onClick={() => (i.chave === "ofertas" ? irPara("ofertas") : onEscolher(i.chave))}
            className={`shrink-0 rounded-full px-3 py-1.5 font-medium transition-colors hover:bg-secondary ${
              i.chave === "ofertas" ? "text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {i.nome}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ---------------- 2. Banner principal ---------------- */
const iconMap: Record<string, Icone> = {
  Tag,
  Smartphone,
  SatelliteDish,
  Bike,
  Plane,
  Tv,
  Star,
  Zap,
};

function BannerIcon({ name }: { name: string }) {
  const Icon = iconMap[name] ?? Tag;
  return <Icon className="h-48 w-48 text-primary-foreground/20" />;
}

export function BannerPrincipal({
  onEscolher,
  banners = DEFAULT_BANNERS,
}: {
  onEscolher: Escolher;
  banners?: BannerPrincipal[];
}) {
  const activeBanners = (banners.length ? banners : DEFAULT_BANNERS).filter((banner) => banner.active);
  const [atual, setAtual] = useState(0);
  const [pausa, setPausa] = useState(false);

  useEffect(() => {
    if (atual >= activeBanners.length && activeBanners.length > 0) setAtual(0);
  }, [activeBanners.length, atual]);

  useEffect(() => {
    if (pausa || activeBanners.length <= 1) return;
    const seconds = Math.max(2, activeBanners[atual]?.autoplaySeconds ?? 5);
    const t = setTimeout(
      () => setAtual((index) => (index + 1) % activeBanners.length),
      seconds * 1000,
    );
    return () => clearTimeout(t);
  }, [pausa, atual, activeBanners]);

  const mover = (d: number) => {
    if (activeBanners.length <= 1) return;
    setAtual((index) => (index + d + activeBanners.length) % activeBanners.length);
  };

  const executarAcao = (banner: BannerPrincipal) => {
    if (banner.actionType === "none" || !banner.actionValue) return;
    if (banner.actionType === "url") {
      window.open(banner.actionValue, "_blank", "noopener,noreferrer");
      return;
    }
    if (banner.actionValue === "ofertas") {
      irPara("ofertas");
      return;
    }
    onEscolher(banner.actionValue);
  };

  if (activeBanners.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <div
        className="relative overflow-hidden rounded-3xl border border-border"
        onMouseEnter={() => setPausa(true)}
        onMouseLeave={() => setPausa(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${atual * 100}%)` }}
        >
          {activeBanners.map((banner) => {
            const textAlign =
              banner.textAlign === "center"
                ? "justify-center text-center"
                : banner.textAlign === "right"
                  ? "justify-end text-right"
                  : "justify-start text-left";
            return (
              <div
                key={banner.id}
                className="relative flex min-h-[260px] w-full shrink-0 items-center overflow-hidden px-8 py-10 sm:min-h-[340px] sm:px-16"
              >
                {banner.backgroundImageUrl && (
                  <div
                    className="absolute inset-0 hidden bg-cover bg-center md:block"
                    style={{ backgroundImage: `url(${banner.backgroundImageUrl})` }}
                  />
                )}
                {banner.backgroundMobileImageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center md:hidden"
                    style={{ backgroundImage: `url(${banner.backgroundMobileImageUrl})` }}
                  />
                ) : banner.backgroundImageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center md:hidden"
                    style={{ backgroundImage: `url(${banner.backgroundImageUrl})` }}
                  />
                ) : null}
                {!banner.backgroundImageUrl && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(70% 120% at 85% 50%, var(--color-brand) 0%, var(--color-card) 70%)",
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: Math.max(0.08, Math.min(1, banner.overlayOpacity)) }}
                />
                <div className={`relative z-10 flex w-full min-h-[220px] items-center ${textAlign}`}>
                  <div className="max-w-2xl text-white">
                    {banner.badge && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                        <Sparkles className="h-3.5 w-3.5" /> {banner.badge}
                      </span>
                    )}
                    <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="mt-3 text-muted-foreground sm:text-lg">{banner.subtitle}</p>
                    )}
                    {banner.buttonLabel && (
                      <button
                        type="button"
                        onClick={() => executarAcao(banner)}
                        disabled={banner.actionType === "none"}
                        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 disabled:cursor-default disabled:opacity-90"
                      >
                        {banner.buttonLabel}
                      </button>
                    )}
                  </div>
                </div>
                <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 md:block">
                  <BannerIcon name={banner.iconName} />
                </div>
              </div>
            );
          })}
        </div>

        {activeBanners.length > 1 && (
          <>
            <button type="button" aria-label="Anterior" onClick={() => mover(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/70 p-2 backdrop-blur hover:bg-secondary">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Próximo" onClick={() => mover(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/70 p-2 backdrop-blur hover:bg-secondary">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {activeBanners.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`Banner ${i + 1}`}
                  onClick={() => setAtual(i)}
                  className={`h-2 rounded-full transition-all ${i === atual ? "w-6 bg-primary" : "w-2 bg-muted-foreground/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------------- 3. Banners secundários ---------------- */
const secundarios: { titulo: string; desc: string; chave: string; icone: Icone }[] = [
  { titulo: "Linha Apple", desc: "iPhone, iPad e acessórios originais.", chave: "celulares", icone: Smartphone },
  { titulo: "Drones DJI", desc: "Imagens aéreas com estabilidade profissional.", chave: "eletronicos", icone: Plane },
  { titulo: "Acessórios", desc: "Capas, cabos, fones e muito mais.", chave: "acessorios", icone: Headphones },
];

export function BannersSecundarios({ onEscolher }: { onEscolher: Escolher }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 pt-5 sm:px-6 md:grid-cols-3">
      {secundarios.map((b) => {
        const I = b.icone;
        return (
          <button
            key={b.titulo}
            type="button"
            onClick={() => onEscolher(b.chave)}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/70 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60"
          >
            <div>
              <h3 className="font-display text-lg font-bold">{b.titulo}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Ver produtos <ChevronRight className="h-4 w-4" />
              </span>
            </div>
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/15 transition-transform group-hover:scale-110">
              <I className="h-8 w-8 text-primary" />
            </span>
          </button>
        );
      })}
    </section>
  );
}

/* ---------------- 4. Compre por categoria ---------------- */
const catCards: { chave: string; nome: string; icone: Icone }[] = [
  { chave: "celulares", nome: "Celulares", icone: Smartphone },
  { chave: "informatica", nome: "Notebooks", icone: Laptop },
  { chave: "audio", nome: "Áudio", icone: Headphones },
  { chave: "smartwatches", nome: "Smartwatches", icone: Watch },
  { chave: "games", nome: "Games", icone: Gamepad2 },
  { chave: "tvs", nome: "TVs", icone: Tv },
  { chave: "casa", nome: "Casa", icone: Home },
  { chave: "acessorios", nome: "Acessórios", icone: Plug },
  { chave: "cameras", nome: "Câmeras", icone: Camera },
  { chave: "eletrodomesticos", nome: "Eletrodomésticos", icone: Zap },
];

export function CompreCategoria({ onEscolher }: { onEscolher: Escolher }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <h2 className="font-display text-2xl font-bold">Compre por categoria</h2>
      <div className="mt-5 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-10 lg:overflow-visible">
        {catCards.map((c) => {
          const I = c.icone;
          return (
            <button key={c.nome} type="button" onClick={() => onEscolher(c.chave)} className="group flex w-20 shrink-0 flex-col items-center gap-2 lg:w-auto">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-border bg-card transition-all group-hover:border-primary group-hover:bg-primary/15">
                <I className="h-7 w-7 text-primary" />
              </span>
              <span className="text-center text-xs font-medium">{c.nome}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Card de produto ---------------- */
function useFavoritos() {
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    try {
      setFavs(JSON.parse(localStorage.getItem("regtech-favs") ?? "[]"));
    } catch {
      setFavs([]);
    }
    const sync = () => setFavs(JSON.parse(localStorage.getItem("regtech-favs") ?? "[]"));
    window.addEventListener("regtech-favs", sync);
    return () => window.removeEventListener("regtech-favs", sync);
  }, []);
  const alternar = (id: string) => {
    const atual: string[] = JSON.parse(localStorage.getItem("regtech-favs") ?? "[]");
    const novo = atual.includes(id) ? atual.filter((f) => f !== id) : [...atual, id];
    localStorage.setItem("regtech-favs", JSON.stringify(novo));
    window.dispatchEvent(new Event("regtech-favs"));
  };
  return { favs, alternar };
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(nota) ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

export function ProdutoCardLoja({ produto, whatsappPhone = "5594992989833" }: { produto: ProdutoLoja; whatsappPhone?: string }) {
  const { favs, alternar } = useFavoritos();
  const { adicionar, abrirCarrinho } = useCarrinho();
  const [pedidoAberto, setPedidoAberto] = useState(false);
  const fav = favs.includes(produto.id);
  const desconto =
    produto.preco && produto.precoAntigo && produto.precoAntigo > produto.preco
      ? Math.round((1 - produto.preco / produto.precoAntigo) * 100)
      : null;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-card/70 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary/50">
        {produto.imagemUrl ? (
          <img src={produto.imagemUrl} alt={produto.titulo} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center" style={{ background: "radial-gradient(circle at 50% 40%, var(--color-brand) 0%, transparent 70%)" }}>
            <Package className="h-12 w-12 text-primary-foreground/60" />
          </div>
        )}
        {desconto && (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">-{desconto}%</span>
        )}
        <button
          type="button"
          aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
          onClick={() => alternar(produto.id)}
          className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur transition-colors hover:bg-background"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-destructive text-destructive" : ""}`} />
        </button>
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{produto.marca}</p>
      <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">
        <a href={`/produto/${encodeURIComponent(produto.productCode)}`} className="hover:text-primary">
          {produto.titulo}
        </a>
      </h3>
      <a
        href={`/produto/${encodeURIComponent(produto.productCode)}`}
        className="mt-1 inline-flex text-xs font-semibold text-primary hover:underline"
      >
        Ver produto e compartilhar
      </a>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Estrelas nota={produto.avaliacao} />
        {produto.avaliacao.toFixed(1).replace(".", ",")} ({produto.avaliacoes})
      </div>

      <div className="mt-3 flex-1">
        {produto.preco ? (
          <>
            {produto.precoAntigo && <p className="text-xs text-muted-foreground line-through">De {brl(produto.precoAntigo)}</p>}
            <p className="font-display text-xl font-bold text-primary">{brl(produto.preco)}</p>
            <p className="text-xs text-muted-foreground">à vista ou 12x de {brl(produto.preco / 12)} sem juros</p>
          </>
        ) : (
          <p className="font-display text-lg font-bold text-primary">Sob consulta</p>
        )}
      </div>

      {produto.preco != null && produto.emEstoque ? (
        <button
          type="button"
          onClick={() => {
            adicionar(produto);
            abrirCarrinho();
          }}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent"
        >
          <ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setPedidoAberto(true)}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent"
        >
          <ShoppingCart className="h-4 w-4" /> Solicitar pedido
        </button>
      )}
      <a
        href={whatsappComMensagem(`Olá! Quero comprar: ${produto.titulo} (${produto.marca}).`, whatsappPhone)}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        Falar no WhatsApp
      </a>
      <SolicitarPedidoModal produto={pedidoAberto ? produto : null} onClose={() => setPedidoAberto(false)} />
    </article>
  );
}

/* ---------------- 5. Ofertas do dia ---------------- */
function Contador() {
  const [txt, setTxt] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const agora = new Date();
      const fim = new Date(agora);
      fim.setHours(24, 0, 0, 0);
      const s = Math.floor((fim.getTime() - agora.getTime()) / 1000);
      const p = (n: number) => String(n).padStart(2, "0");
      setTxt(`${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-sm font-semibold text-destructive">
      <Timer className="h-4 w-4" /> Termina em <span className="tabular-nums">{txt}</span>
    </span>
  );
}

export function OfertasDoDia({ produtos, titulo = "Ofertas do dia", subtitulo, whatsappPhone = "5594992989833" }: { produtos: ProdutoLoja[]; titulo?: string; subtitulo?: string | null; whatsappPhone?: string }) {
  if (produtos.length === 0) return null;
  return (
    <section id="ofertas" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-14 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div><h2 className="font-display text-2xl font-bold">{titulo}</h2>{subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}</div>
        <Contador />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {produtos.map((p) => (
          <ProdutoCardLoja key={p.id} produto={p} whatsappPhone={whatsappPhone} />
        ))}
      </div>
    </section>
  );
}

/* ---------------- 6. Carrossel de produtos ---------------- */
export function ProdutoCarrossel({
  titulo,
  subtitulo,
  produtos,
  onVerTodos,
  whatsappPhone = "5594992989833",
}: {
  titulo: string;
  subtitulo?: string;
  produtos: ProdutoLoja[];
  onVerTodos?: () => void;
  whatsappPhone?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rolar = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });
  if (produtos.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">{titulo}</h2>
          {subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}
        </div>
        <div className="flex items-center gap-2">
          {onVerTodos && (
            <button type="button" onClick={onVerTodos} className="mr-2 text-sm font-semibold text-primary hover:underline">
              Ver todos
            </button>
          )}
          <button type="button" aria-label="Voltar" onClick={() => rolar(-1)} className="rounded-full border border-border p-2 hover:bg-secondary">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Avançar" onClick={() => rolar(1)} className="rounded-full border border-border p-2 hover:bg-secondary">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="mt-5 flex snap-x gap-4 overflow-x-auto scroll-smooth pb-4 pt-1">
        {produtos.map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
            <ProdutoCardLoja produto={p} whatsappPhone={whatsappPhone} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 8. Benefícios ---------------- */
const beneficios: { t: string; i: Icone }[] = [
  { t: "Frete para todo o Brasil", i: Truck },
  { t: "Compra segura", i: Lock },
  { t: "Até 12x no cartão", i: CreditCard },
  { t: "Envio rápido", i: Zap },
  { t: "Garantia nos produtos", i: ShieldCheck },
  { t: "Atendimento especializado", i: MessageCircle },
];

export function Beneficios() {
  return (
    <section className="mt-14 border-y border-border/60 bg-card/40">
      <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-6 sm:px-6 lg:grid lg:grid-cols-6 lg:overflow-visible">
        {beneficios.map((b) => {
          const I = b.i;
          return (
            <div key={b.t} className="flex w-44 shrink-0 items-center gap-3 lg:w-auto">
              <I className="h-6 w-6 shrink-0 text-primary" />
              <span className="text-sm font-medium">{b.t}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- 11. Principais marcas (banco de dados) ---------------- */
export function MarcasSecao({ marcas, onMarca }: { marcas: MarcaLoja[]; onMarca: (nome: string) => void }) {
  if (marcas.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <h2 className="font-display text-2xl font-bold">Principais marcas</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {marcas.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onMarca(m.nome)}
            className="grid h-20 place-items-center rounded-2xl border border-border bg-card/70 px-3 transition-all hover:-translate-y-0.5 hover:border-primary/60"
          >
            {m.logoUrl ? (
              <img src={m.logoUrl} alt={m.nome} className="max-h-10 object-contain" />
            ) : (
              <span className="font-display text-lg font-bold tracking-tight">{m.nome}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 12. Newsletter ---------------- */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor) || valor.length > 255) {
      toast.error("Digite um e-mail válido.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.from("newsletter").insert({ email: valor });
    setEnviando(false);
    if (error && error.code !== "23505") {
      toast.error("Não foi possível cadastrar agora. Tente novamente.");
      return;
    }
    toast.success("Pronto! Você vai receber nossas melhores ofertas.");
    setEmail("");
  };
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-card/70 px-6 py-10 text-center md:flex-row md:text-left">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/15">
          <Mail className="h-7 w-7 text-primary" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold">Receba nossas melhores ofertas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre seu e-mail e fique por dentro das novidades, promoções e lançamentos.
          </p>
        </div>
        <form onSubmit={enviar} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu melhor e-mail"
            className="flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button type="submit" disabled={enviando} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60">
            {enviando ? "Enviando..." : "Quero receber"}
          </button>
        </form>
      </div>
    </section>
  );
}
