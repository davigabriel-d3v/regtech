import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchMarcas, fetchProdutos, fetchProdutoPorCodigo } from "./produtos.server";
import type { MarcaLoja, ProdutoLoja } from "./produtos.server";

export const listarProdutos = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ categoria: z.string().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => fetchProdutos(data.categoria));

export const listarMarcas = createServerFn({ method: "GET" }).handler(async () =>
  fetchMarcas(),
);

export type { MarcaLoja, ProdutoLoja };

export const buscarProdutoPorCodigo = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ codigo: z.string().min(1).max(80) }).parse(data ?? {}))
  .handler(async ({ data }) => fetchProdutoPorCodigo(data.codigo));
