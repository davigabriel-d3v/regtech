import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchMarcas, fetchProdutos } from "./produtos.server";
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
