import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Apple,
  ArrowRight,
  Award,
  Bike,
  Building2,
  Camera,
  ChevronDown,
  Globe,
  Headset,
  LayoutGrid,
  MapPin,
  MonitorSmartphone,
  Plane,
  SatelliteDish,
  Smartphone,
  Tv,
  Watch,
  Wifi,
} from "lucide-react";
import logo from "@/assets/regtech-logo.png";

// TODO: trocar pelo endereço real do site da RegTech
const SITE_URL = "#";
// TODO: trocar pelo número real do WhatsApp da RegTech
const WHATSAPP_URL = "https://wa.me/5594999999999";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RegTech — Referência em Tecnologia há +14 anos" },
      {
        name: "description",
        content:
          "Soluções em tecnologia para residências e empresas em Tucumã-PA e Ourilândia-PA. Seu upgrade começa aqui!",
      },
      {
        property: "og:title",
        content: "RegTech — Referência em Tecnologia há +14 anos",
      },
      {
        property: "og:description",
        content:
          "Tecnologia e soluções digitais em Tucumã-PA e Ourilândia-PA. Seu upgrade começa aqui!",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const services = [
  {
    icon: MonitorSmartphone,
    slug: "assistencia-tecnica",
    title: "Assistência Técnica",
    description:
      "Manutenção de computadores e notebooks com diagnóstico honesto e garantia.",
  },
  {
    icon: Wifi,
    slug: "redes-e-internet",
    title: "Redes e Internet",
    description:
      "Instalação e configuração de redes Wi-Fi para casa e empresa, sem sinal fraco.",
  },
  {
    icon: Camera,
    slug: "cameras-e-seguranca",
    title: "Câmeras e Segurança",
    description:
      "Projetos de segurança eletrônica com instalação e monitoramento pelo celular.",
  },
  {
    icon: Globe,
    slug: "sites-e-sistemas",
    title: "Sites e Sistemas",
    description:
      "Presença digital e sistemas sob medida para o seu negócio crescer.",
  },
  {
    icon: Building2,
    slug: "suporte-empresarial",
    title: "Suporte Empresarial",
    description:
      "Planos de suporte de TI para empresas, com atendimento ágil na região.",
  },
  {
    icon: Headset,
    slug: "atendimento-local",
    title: "Atendimento Local",
    description:
      "Equipe presente em Tucumã-PA e Ourilândia-PA, perto de você.",
  },
];

const products = [
  {
    icon: Bike,
    slug: "motos-eletricas",
    title: "Motos Elétricas",
    description:
      "Motos elétricas para o dia a dia, com orientação na escolha e suporte para rodar sem preocupação.",
  },
  {
    icon: SatelliteDish,
    slug: "starlink",
    title: "Starlink",
    description:
      "Internet via satélite Starlink com instalação e configuração para onde a fibra não chega.",
  },
  {
    icon: Apple,
    slug: "apple",
    title: "Apple",
    description:
      "Produtos Apple com configuração, transferência de dados e suporte de quem entende.",
  },
  {
    icon: Smartphone,
    slug: "realme",
    title: "Realme",
    description:
      "Smartphones Realme com configuração completa, proteção e acompanhamento da nossa equipe.",
  },
  {
    icon: Plane,
    slug: "dji",
    title: "DJI",
    description:
      "Drones e câmeras DJI com ajuste, calibração e orientação para usar desde o primeiro voo.",
  },
  {
    icon: Watch,
    slug: "xiaomi",
    title: "Xiaomi",
    description:
      "Smartphones, relógios e smart devices Xiaomi com configuração e suporte no dia a dia.",
  },
  {
    icon: Tv,
    slug: "samsung",
    title: "Samsung",
    description:
      "Smartphones, TVs e eletrodomésticos Samsung com instalação, configuração e suporte local.",
  },
];

const quickLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Quem somos", href: "#quem-somos" },
  { label: "Serviços", href: "#servicos" },
  { label: "Contato", href: "#contato" },
];

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          {/* Categorias (canto superior esquerdo) */}
          <div className="relative">
            <button
              type="button"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:px-4"
            >
              <LayoutGrid className="h-4 w-4 text-accent" />
              <span className="hidden sm:inline">Categorias</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <nav className="absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-60 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl shadow-primary/10">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Links rápidos
                  </p>
                  {quickLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/15 hover:text-primary"
                    >
                      {link.label}
                    </a>
                  ))}
                  <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categorias
                  </p>
                  {services.map((service) => (
                    <a
                      key={service.slug}
                      href={`#${service.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/15 hover:text-primary"
                    >
                      <service.icon className="h-4 w-4 text-primary" />
                      {service.title}
                    </a>
                  ))}
                  <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Produtos e marcas
                  </p>
                  {products.map((product) => (
                    <a
                      key={product.slug}
                      href={`#${product.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/15 hover:text-primary"
                    >
                      <product.icon className="h-4 w-4 text-primary" />
                      {product.title}
                    </a>
                  ))}
                </nav>
              </>
            )}
          </div>

          <a href="#" className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Logo da RegTech" className="h-9 w-9 rounded-full" />
            <span className="font-display text-lg font-bold tracking-tight">
              Reg<span className="text-primary">Tech</span>
            </span>
          </a>
          <nav className="ml-auto hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#inicio" className="transition-colors hover:text-foreground">
              Início
            </a>
            <a href="#quem-somos" className="transition-colors hover:text-foreground">
              Quem somos
            </a>
            <a href="#servicos" className="transition-colors hover:text-foreground">
              Serviços
            </a>
            <a href="#contato" className="transition-colors hover:text-foreground">
              Contato
            </a>
          </nav>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent md:ml-0"
          >
            Fale conosco
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section
        id="inicio"
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, var(--color-brand) 0%, transparent 65%)",
        }}
      >
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="relative mb-8">
            <div
              className="absolute inset-0 -z-10 scale-125 rounded-full blur-2xl"
              style={{ background: "var(--color-brand)", opacity: 0.35 }}
            />
            <img
              src={logo}
              alt="Logo da RegTech"
              className="h-28 w-28 drop-shadow-xl sm:h-36 sm:w-36"
            />
          </div>

          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium text-foreground">
            <Award className="h-4 w-4 text-accent" />
            Referência em Tecnologia há +14 anos!
          </span>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Tecnologia que faz o
            <br />
            <span className="text-primary">seu dia avançar</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Assistência técnica, redes, segurança e soluções digitais para sua
            casa e sua empresa — com quem é referência na região há mais de 14
            anos.
          </p>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            Tucumã-PA / Ourilândia-PA
          </span>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 hover:bg-accent"
            >
              <Globe className="h-5 w-5" />
              Acesse o Nosso Site
            </a>
            <a
              href="#servicos"
              className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Ver serviços
            </a>
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-10 text-center sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-display text-3xl font-bold text-primary">+14</p>
            <p className="mt-1 text-sm text-muted-foreground">
              anos de experiência
            </p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-primary">2</p>
            <p className="mt-1 text-sm text-muted-foreground">
              cidades atendidas de perto
            </p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-primary">100%</p>
            <p className="mt-1 text-sm text-muted-foreground">
              foco em residências e empresas
            </p>
          </div>
        </div>
      </section>

      {/* Quem somos */}
      <section
        id="quem-somos"
        className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
      >
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Quem <span className="text-primary">somos?</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            A RegTech nasceu da paixão por tecnologia e do desejo de levar
            soluções de verdade para Tucumã-PA e Ourilândia-PA. De uma pequena
            assistência técnica a referência regional: são mais de 14 anos
            transformando desafios em inovação, sempre com atendimento perto de
            você.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[380px]">
          <div
            className="overflow-hidden rounded-2xl border border-border shadow-lg shadow-primary/10"
            style={{ padding: "177.78% 0 0 0", position: "relative" }}
          >
            <iframe
              src="https://player.vimeo.com/video/1228819663?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              title="A História por trás da Regtech Cell Shop"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-2xl text-center">
          <h3 className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            <Smartphone className="h-6 w-6 text-accent sm:h-7 sm:w-7" />
            A História por trás da Regtech Cell Shop!
          </h3>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Toda grande história começa pequena. Assista e descubra como tudo
            começou — uma jornada feita de esforço, aprendizado e amor pela
            tecnologia, que hoje faz da RegTech a referência que é na região.
          </p>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            O que a <span className="text-primary">RegTech</span> faz por você
          </h2>
          <p className="mt-3 text-muted-foreground">
            Soluções completas em tecnologia, do suporte do dia a dia a projetos
            para o seu negócio.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              id={service.slug}
              className="group scroll-mt-24 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* Marcas e produtos */}
        <div className="mt-20 text-center">
          <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Marcas e produtos que a <span className="text-primary">RegTech</span>{" "}
            trabalha
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Você escolhe a marca, a RegTech cuida do resto: instalação,
            configuração e suporte de quem é da região.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.title}
              id={product.slug}
              className="group scroll-mt-24 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <product.icon className="h-6 w-6" />
              </div>
              <h4 className="font-display text-lg font-semibold">
                {product.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section id="contato" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12"
          style={{
            background:
              "radial-gradient(80% 120% at 50% 120%, var(--color-brand) 0%, var(--color-card) 70%)",
          }}
        >
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para o seu upgrade?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Chame a RegTech no WhatsApp e conte o que você precisa. Atendemos
            Tucumã-PA e Ourilândia-PA.
          </p>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 hover:bg-accent"
          >
            <Globe className="h-5 w-5" />
            Acesse o Nosso Site
          </a>
          <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Tucumã-PA / Ourilândia-PA
          </p>
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
