import { createServerFn } from "@tanstack/react-start";
import { fetchLojaSettings } from "./loja-settings.server";

export const listarConfiguracoesLoja = createServerFn({ method: "GET" }).handler(async () =>
  fetchLojaSettings(),
);
