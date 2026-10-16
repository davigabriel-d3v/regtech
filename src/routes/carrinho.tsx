import { Link } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, MessageCircle } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useCarrinho } from "@/components/loja/CarrinhoContext";
import { whatsappComMensagem } from "@/lib/contato";
import logo from "@/assets/regtech-logo.png";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho | RegTech Shop" },
      { property: "og:title", content: "Carrinho | RegTech Shop" },
      { property: "og:description", content: "Revise seus produtos e envie seu pedido para a RegTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Revise seus produtos e envie seu pedido para a RegTech." },
    ],
  }),
  component: CarrinhoPage,
});

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function CarrinhoPage() {
  const { itens, totalItens, totalPreco, alterarQuantidade, remover, limpar } = useCarrinho();

  const finalizarWhatsApp = () => {
    const linhas = itens.map(
      ({ produto, quantidade }) =>
        `• ${quantidade}x ${produto.titulo} — ${produto.preco != null ? brl(produto.preco * quantidade) : "sob consulta"}`,
    );
    const mensagem = [
      "Olá! Quero finalizar este pedido pela RegTech:",
      "",
      ...linhas,
      "",
      `Total estimado: ${brl(totalPreco)}`,
      `Quantidade de itens: ${totalItens}`,
    ].join("\n");
    window.open(whatsappComMensagem(mensagem), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/shop" className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">Continuar comprando</span>
          </Link>
          <Link to="/shop" className="flex items-center gap-2" aria-label="RegTech Shop">
            <img src={logo} alt="" className="h-8 w-8 rounded-full" />
            <span className="font-display font-bold">Reg<span className="text-primary">Tech</span></span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <p className="text-sm font-semibold text-primary">Seu pedido</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Carrinho</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {totalItens === 0 ? "Seu carrinho está vazio." : `${totalItens} ${totalItens === 1 ? "item" : "itens"} no carrinho`}
          </p>
        </div>

        {itens.length === 0 ? (
          <section className="rounded-3xl border border-border bg-card p-8 text-center sm:p-14">
            <ShoppingBag className="mx-auto h-14 w-14 text-primary/60" />
            <h2 className="mt-5 font-display text-2xl font-bold">Seu carrinho está vazio</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Escolha um produto na loja e ele aparecerá aqui. Seus itens ficam salvos neste dispositivo.
            </p>
            <Link to="/shop" className="mt-7 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent">
              Ver produtos
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-3">
              {itens.map(({ produto, quantidade }) => (
                <article key={produto.id} className="rt-cart-item flex gap-3 rounded-2xl border border-border bg-card p-3 sm:gap-5 sm:p-4">
                  <Link to="/produto/$productCode" params={{ productCode: produto.productCode }} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-28">
                    {produto.imagemUrl ? (
                      <img src={produto.imagemUrl} alt={produto.titulo} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{produto.marca}</p>
                    <Link to="/produto/$productCode" params={{ productCode: produto.productCode }} className="mt-1 block line-clamp-2 text-sm font-semibold hover:text-primary sm:text-base">
                      {produto.titulo}
                    </Link>
                    <p className="mt-1 text-sm font-bold text-primary">
                      {produto.preco != null ? brl(produto.preco) : "Sob consulta"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button type="button" aria-label={`Diminuir quantidade de ${produto.titulo}`} onClick={() => alterarQuantidade(produto.id, quantidade - 1)} className="grid h-9 w-9 place-items-center hover:bg-secondary">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span key={quantidade} className="rt-cart-feedback w-9 text-center text-sm font-semibold tabular-nums" aria-live="polite">{quantidade}</span>
                        <button type="button" aria-label={`Aumentar quantidade de ${produto.titulo}`} onClick={() => alterarQuantidade(produto.id, quantidade + 1)} className="grid h-9 w-9 place-items-center hover:bg-secondary">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button type="button" onClick={() => remover(produto.id)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" /> Remover
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-3xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-xl font-bold">Resumo</h2>
              <div className="mt-5 space-y-3 border-b border-border pb-5 text-sm">
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Produtos</span><span>{totalItens}</span>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Subtotal</span><span className="font-semibold text-foreground">{brl(totalPreco)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Frete e condições finais serão confirmados no atendimento.</p>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <span className="text-sm font-medium">Total estimado</span>
                <span className="font-display text-2xl font-bold text-primary">{brl(totalPreco)}</span>
              </div>
              <button type="button" onClick={finalizarWhatsApp} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-accent">
                <MessageCircle className="h-5 w-5" />
                Finalizar pelo WhatsApp
              </button>
              <button type="button" onClick={limpar} className="mt-2 w-full rounded-2xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary">
                Limpar carrinho
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
