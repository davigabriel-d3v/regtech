import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchProdutos } from "./produtos.server";
import type { ProdutoLoja } from "./produtos.server";

export const listarProdutos = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ categoria: z.string().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => fetchProdutos(data.categoria));

export type { ProdutoLoja };
