export type LojaSettings = {
  id: string;
  whatsappPhone: string;
  offersEnabled: boolean;
  offersTitle: string;
  offersSubtitle: string | null;
  offersLimit: number;
  featuredEnabled: boolean;
  featuredTitle: string;
  featuredSubtitle: string | null;
  featuredLimit: number;
};

export const DEFAULT_LOJA_SETTINGS: LojaSettings = {
  id: "default",
  whatsappPhone: "5594992989833",
  offersEnabled: true,
  offersTitle: "Ofertas do dia",
  offersSubtitle: null,
  offersLimit: 8,
  featuredEnabled: true,
  featuredTitle: "Destaques da RegTech",
  featuredSubtitle: "Produtos selecionados para aparecer em destaque na vitrine.",
  featuredLimit: 8,
};