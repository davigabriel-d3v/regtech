"use client";

import { createContext, useContext, useCallback, useMemo, useState } from "react";
import { ProdutoLoja } from "@/lib/produtos.functions";
import { toast } from "sonner";

interface FavoritosContextType {
  favoritos: ProdutoLoja[];
  adicionarFavorito: (produto: ProdutoLoja) => void;
  removerFavorito: (produtoId: string) => void;
  ehFavorito: (produtoId: string) => boolean;
  totalFavoritos: number;
}

const FavoritosContext = createContext<FavoritosContextType | null>(null);

export function FavoritosProvider({ children }: { children: React.ReactNode }) {
  const [favoritos, setFavoritos] = useState<ProdutoLoja[]>([]);

  const adicionarFavorito = useCallback((produto: ProdutoLoja) => {
    setFavoritos((prev) => {
      if (prev.find((f) => f.id === produto.id)) {
        toast.info("Produto já nos favoritos");
        return prev;
      }
      toast.success("Adicionado aos favoritos");
      return [produto, ...prev];
    });
  }, []);

  const removerFavorito = useCallback((produtoId: string) => {
    setFavoritos((prev) => prev.filter((f) => f.id !== produtoId));
    toast.info("Removido dos favoritos");
  }, []);

  const ehFavorito = useCallback(
    (produtoId: string) => favoritos.some((f) => f.id === produtoId),
    [favoritos]
  );

  const totalFavoritos = favoritos.length;

  const value = useMemo(
    () => ({ favoritos, adicionarFavorito, removerFavorito, ehFavorito, totalFavoritos }),
    [favoritos, adicionarFavorito, removerFavorito, ehFavorito, totalFavoritos]
  );

  return (
    <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>
  );
}

export function useFavoritos(): FavoritosContextType {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error("useFavoritos deve ser usado dentro de FavoritosProvider");
  return ctx;
}
