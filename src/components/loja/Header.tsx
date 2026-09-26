"use client";

import { useState, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, Heart, Menu, X, ChevronDown, Package } from "lucide-react";
import { ContaBotao } from "@/components/ContaBotao";
import { useCarrinho } from "./CarrinhoContext";
import { useFavoritos } from "./FavoritosContext";
import { BuscaDialog } from "./BuscaDialog";

export function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const { totalItens, abrirCarrinho } = useCarrinho();
  const { totalFavoritos } = useFavoritos();

  const navCategorias = [
    { slug: "ofertas", nome: "Ofertas" },
    { slug: "celulares", nome: "Celulares" },
    { slug: "informatica", nome: "Informática" },
    { slug: "eletronicos", nome: "Eletrônicos" },
    { slug: "acessorios", nome: "Acessórios" },
    { slug: "casa", nome: "Casa" },
    { slug: "eletrodomesticos", nome: "Eletrodomésticos" },
    { slug: "games", nome: "Games" },
    { slug: "todas", nome: "Mais" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-lg font-bold">
            Reg<span className="text-primary">Tech</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {navCategorias.map((c) => (
            <Link
              key={c.slug}
              to={c.slug === "todas" ? "/shop" : `/shop?cat=${c.slug}`}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {c.nome}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuAberto((a) => !a)}
          className="ml-auto flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary md:hidden"
          aria-label="Menu"
        >
          {menuAberto ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span className="hidden sm:inline">Categorias</span>
          <ChevronDown className={`h-4 w-4 transition-transform sm:hidden ${menuAberto ? "rotate-180" : ""}`} />
        </button>

        <div className="flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => setBuscaAberta(true)}
            className="flex w-full items-center gap-3 rounded-full border border-input bg-background px-4 py-2.5 text-sm text-muted-foreground transition-colors focus-within:border-primary/60 hover:bg-secondary"
          >
            <Search className="h-4 w-4" />
            <span>Busque produtos, marcas e categorias...</span>
            <kbd className="ml-auto hidden rounded-md border border-border bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Favoritos"
          >
            <Heart className="h-5 w-5" />
            {totalFavoritos > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {totalFavoritos}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={abrirCarrinho}
            className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItens > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItens}
              </span>
            )}
          </button>

          <ContaBotao />
        </div>
      </div>

      {menuAberto && (
        <nav className="md:hidden border-t border-border/60 bg-card/50 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {navCategorias.map((c) => (
              <Link
                key={c.slug}
                to={c.slug === "todas" ? "/shop" : `/shop?cat=${c.slug}`}
                onClick={() => setMenuAberto(false)}
                className="rounded-full px-3 py-1.5 text-sm font-medium bg-secondary text-foreground"
              >
                {c.nome}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {buscaAberta && <BuscaDialog onClose={() => setBuscaAberta(false)} />}
    </header>
  );
}