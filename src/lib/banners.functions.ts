import { createServerFn } from "@tanstack/react-start";
import { fetchBanners } from "./banners.server";

export const listarBanners = createServerFn({ method: "GET" }).handler(async () => {
  return fetchBanners();
});
