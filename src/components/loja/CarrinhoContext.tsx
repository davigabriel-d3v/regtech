"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useReducer } from "react";
import { ProdutoLoja } from "@/lib/produtos.functions";
import { toast } from "sonner";

interface ItemCarrinho {
  produto: ProdutoLoja;
  quantidade: number;
}

interface CarrinhoState {
  itens: ItemCarrinho[];
  aberto: boolean;
}

type CarrinhoAction =
  | { type: "ADICIONAR"; produto: ProdutoLoja }
  | { type: "REMOVER"; produtoId: string }
  | { type: "ALTERAR_QUANTIDADE"; produtoId: string; quantidade: number }
  | { type: "LIMPAR" }
  | { type: "TOGGLE_ABERTO" }
  | { type: "SET_ABERTO"; aberto: boolean };

function carrinhoReducer(state: CarrinhoState, action: CarrinhoAction): CarrinhoState {
  switch (action.type) {
    case "ADICIONAR": {
      const existing = state.itens.find((i) => i.produto.id === action.produto.id);
      if (existing) {
        return {
          ...state,
          itens: state.itens.map((i) =>
            i.produto.id === action.produto.id
              ? { ...i, quantidade: i.quantidade + 1 }
              : i
          ),
        };
      }
      return { ...state, itens: [...state.itens, { produto: action.produto, quantidade: 1 }] };
    }
    case "REMOVER":
      return { ...state, itens: state.itens.filter((i) => i.produto.id !== action.produtoId) };
    case "ALTERAR_QUANTIDADE":
      return {
        ...state,
        itens: state.itens.map((i) =>
          i.produto.id === action.produtoId ? { ...i, quantidade: Math.max(0, action.quantidade) } : i
        ).filter((i) => i.quantidade > 0),
      };
    case "LIMPAR":
      return { ...state, itens: [] };
    case "TOGGLE_ABERTO":
      return { ...state, aberto: !state.aberto };
    case "SET_ABERTO":
      return { ...state, aberto: action.aberto };
    default:
      return state;
  }
}

interface CarrinhoContextType {
  itens: ItemCarrinho[];
  totalItens: number;
  totalPreco: number;
  aberto: boolean;
  adicionar: (produto: ProdutoLoja) => void;
  remover: (produtoId: string) => void;
  alterarQuantidade: (produtoId: string, quantidade: number) => void;
  limpar: () => void;
  abrirCarrinho: () => void;
  fecharCarrinho: () => void;
  toggleCarrinho: () => void;
}

const CarrinhoContext = createContext<CarrinhoContextType | null>(null);

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(carrinhoReducer, { itens: [], aberto: false });

  useEffect(() => {
    try {
      const salvo = localStorage.getItem("regtech-cart");
      if (!salvo) return;
      const itens = JSON.parse(salvo) as ItemCarrinho[];
      if (Array.isArray(itens)) {
        for (const item of itens) {
          if (item?.produto?.id && item.quantidade > 0) {
            dispatch({ type: "ADICIONAR", produto: item.produto });
            for (let i = 1; i < item.quantidade; i += 1) {
              dispatch({ type: "ADICIONAR", produto: item.produto });
            }
          }
        }
      }
    } catch {
      localStorage.removeItem("regtech-cart");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("regtech-cart", JSON.stringify(state.itens));
    } catch {
      // O carrinho continua funcionando em memória se o armazenamento estiver indisponível.
    }
  }, [state.itens]);

  const adicionar = useCallback((produto: ProdutoLoja) => {
    dispatch({ type: "ADICIONAR", produto });
    toast.success(`${produto.titulo} adicionado ao carrinho`);
  }, []);

  const remover = useCallback((produtoId: string) => {
    dispatch({ type: "REMOVER", produtoId });
  }, []);

  const alterarQuantidade = useCallback((produtoId: string, quantidade: number) => {
    dispatch({ type: "ALTERAR_QUANTIDADE", produtoId, quantidade });
  }, []);

  const limpar = useCallback(() => {
    dispatch({ type: "LIMPAR" });
  }, []);

  const abrirCarrinho = useCallback(() => dispatch({ type: "SET_ABERTO", aberto: true }), []);
  const fecharCarrinho = useCallback(() => dispatch({ type: "SET_ABERTO", aberto: false }), []);
  const toggleCarrinho = useCallback(() => dispatch({ type: "TOGGLE_ABERTO" }), []);

  const totalItens = useMemo(() => state.itens.reduce((s, i) => s + i.quantidade, 0), [state.itens]);
  const totalPreco = useMemo(
    () => state.itens.reduce((s, i) => s + (i.produto.preco ?? 0) * i.quantidade, 0),
    [state.itens]
  );

  const value = useMemo<CarrinhoContextType>(
    () => ({
      itens: state.itens,
      totalItens,
      totalPreco,
      aberto: state.aberto,
      adicionar,
      remover,
      alterarQuantidade,
      limpar,
      abrirCarrinho,
      fecharCarrinho,
      toggleCarrinho,
    }),
    [state.itens, totalItens, totalPreco, state.aberto, adicionar, remover, alterarQuantidade, limpar, abrirCarrinho, fecharCarrinho, toggleCarrinho]
  );

  return <CarrinhoContext.Provider value={value}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho(): CarrinhoContextType {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho deve ser usado dentro de CarrinhoProvider");
  return ctx;
}
