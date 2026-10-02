import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Copy, MessageCircle, Package, Share2 } from "lucide-react";
import { toast } from "sonner";
import { buscarProdutoPorCodigo } from "@/lib/produtos.functions";
import { whatsappComMensagem } from "@/lib/contato";

export const Route = createFileRoute("/produto/$productCode")({
  loader: async ({ params }) => buscarProdutoPorCodigo({ data: { codigo: params.productCode } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.titulo} | RegTech Shop` : "Produto | RegTech Shop" },
      {
        name: "description",
        content: loaderData?.descricao || "Confira este produto na RegTech Shop.",
      },
      ...(loaderData?.imagemUrl ? [{ property: "og:image", content: loaderData.imagemUrl }] : []),
      { property: "og:type", content: "product" },
    ],
  }),
  component: ProdutoCompartilhado,
  notFoundComponent: ProdutoNaoEncontrado,
});

const brl = (value: number | null) =>
  value == null ? "Sob consulta" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function ProdutoCompartilhado() {
  const product = Route.useLoaderData();
  const [imageIndex, setImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const images = useMemo(() => {
    if (!product) return [];
    return product.imagemUrl ? [product.imagemUrl] as string[] : [];
  }, [product]);

  if (!product) return <ProdutoNaoEncontrado />;

  const shareUrl = typeof window === "undefined"
    ? `/produto/${encodeURIComponent(product.productCode)}`
    : window.location.href;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link do produto copiado!");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  async function shareProduct() {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.titulo, text: `Confira este produto da RegTech: ${product.titulo}`, url: shareUrl });
      } catch {
        // Cancelamento do compartilhamento não é erro para o usuário.
      }
      return;
    }
    await copyLink();
  }

  const whatsapp = whatsappComMensagem(`Olá! Tenho interesse no produto: ${product.titulo} (${product.marca}). Link: ${shareUrl}`);

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/shop" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" /> Voltar para a loja
          </Link>
          <div className="flex gap-2">
            <button onClick={() => void shareProduct()} className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
            <button onClick={() => void copyLink()} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-8 rounded-3xl border border-border bg-card p-5 shadow-xl md:grid-cols-2 md:p-8">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-secondary/50">
              {images.length ? (
                <img src={images[imageIndex] ?? images[0]} alt={product.titulo} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center"><Package className="h-20 w-20 text-muted-foreground/50" /></div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2"><ChevronLeft /></button>
                  <button onClick={() => setImageIndex((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2"><ChevronRight /></button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{product.marca} · {product.categoria}</span>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{product.titulo}</h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">ID do produto: {product.productCode}</p>

            <div className="mt-7">
              {product.precoAntigo != null && <p className="text-sm text-muted-foreground line-through">De {brl(product.precoAntigo)}</p>}
              <p className="font-display text-3xl font-bold text-primary">{brl(product.preco)}</p>
              {product.emEstoque ? <p className="mt-1 text-sm font-medium text-primary">Em estoque</p> : <p className="mt-1 text-sm text-destructive">Sem estoque</p>}
            </div>

            {product.descricao && <div className="mt-7"><h2 className="font-display text-lg font-bold">Descrição</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.descricao}</p></div>}

            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-accent">
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
              <button onClick={() => void copyLink()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3.5 text-sm font-semibold hover:bg-secondary">
                <Copy className="h-4 w-4" /> Enviar este link
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Link exclusivo deste produto</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{shareUrl}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProdutoNaoEncontrado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h1 className="mt-4 font-display text-2xl font-bold">Produto não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Este produto pode estar inativo, ter sido removido ou o link pode estar incorreto.</p>
        <Link to="/shop" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Ir para a loja</Link>
      </div>
    </div>
  );
}
