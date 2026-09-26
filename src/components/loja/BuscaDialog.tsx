"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Package, ArrowRight } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { listarProdutos } from "@/lib/produtos.functions";
import type { ProdutoLoja } from "@/lib/produtos.functions";

interface BuscaDialogProps {
  onClose: () => void;
}

export function BuscaDialog({ onClose }: BuscaDialogProps) {
  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState<ProdutoLoja[]>([]);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const debounceBusca = useDebounce(busca, 250);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (debounceBusca.length < 2) { setProdutos([]); return; }
    setCarregando(true);
    const t = setTimeout(async () => {
      try {
        const data = await listarProdutos();
        const filtrados = data.filter(
          (p) => p.titulo.toLowerCase().includes(debounceBusca.toLowerCase()) ||
            p.marca.toLowerCase().includes(debounceBusca.toLowerCase()) ||
            p.categoria.toLowerCase().includes(debounceBusca.toLowerCase())
        );
        setProdutos(filtrados.slice(0, 6));
      } catch { setProdutos([]); }
      setCarregando(false);
    }, 200);
    return () => clearTimeout(t);
  }, [debounceBusca]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={onClose}>
        <div className="flex items-center gap-3 rounded-full border border-input bg-background px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Busque produtos, marcas ou categorias..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {busca && (
            <button type="button" onClick={() => { setBusca(""); setProdutos([]); }} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
              <Package className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-4 max-h-[70vh] overflow-y-auto">
          {!busca && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buscas populares</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { titulo: "Celulares", slug: "celulares" },
                  { titulo: "Notebooks", slug: "informatica" },
                  { titulo: "Eletrônicos", slug: "eletronicos" },
                  { titulo: "Acessórios", slug: "acessorios" },
                  { titulo: "Ofertas", slug: "ofertas" },
                ].map((a) => (
                  <button key={a.slug} type="button" onClick={() => navigate(`/shop?cat=${a.slug}`)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary hover:text-foreground">
                    {a.titulo}
                  </button>
                ))}
              </div>
            </div>
          )}
          {carregando && <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> Buscando...</div>}
          {produtos.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resultados</p>
              <div className="space-y-2">
                {produtos.map((p) => (
                  <button key={p.id} type="button"
                    onClick={() => { navigate(`/shop?produto=${p.slug}`); onClose(); }}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-secondary">
                    {p.imagemUrl ? (
                      <img src={p.imagemUrl} alt={p.titulo} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Package className="h-5 w-5 text-muted-foreground" /></div>
                    )}
                    <div className="flex-1 min-w-0"><p className="truncate text-sm font-medium">{p.titulo}</p><p className="text-xs text-muted-foreground">{p.marca}</p></div>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {p.preco ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.preco) : "Sob consulta"}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {!carregando && busca.length >= 2 && produtos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Package className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}