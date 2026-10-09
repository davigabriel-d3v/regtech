export type BannerPrincipal = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  buttonLabel: string;
  actionType: "section" | "url" | "none";
  actionValue: string | null;
  iconName: string;
  backgroundImageUrl: string | null;
  backgroundMobileImageUrl: string | null;
  overlayOpacity: number;
  backgroundColor: string;
  textAlign: "left" | "center" | "right";
  active: boolean;
  displayOrder: number;
  autoplaySeconds: number;
};

export const DEFAULT_BANNERS: BannerPrincipal[] = [
  {
    id: "default-1",
    title: "Ofertas que cabem no seu bolso",
    subtitle: "Os melhores produtos com condições especiais.",
    badge: "RegTech Shop",
    buttonLabel: "Ver ofertas",
    actionType: "section",
    actionValue: "ofertas",
    iconName: "Tag",
    backgroundImageUrl: null,
    backgroundMobileImageUrl: null,
    overlayOpacity: 0.12,
    backgroundColor: "#073b8c",
    textAlign: "left",
    active: true,
    displayOrder: 0,
    autoplaySeconds: 5,
  },
  {
    id: "default-2",
    title: "Smartphones com suporte RegTech",
    subtitle: "Apple, Samsung, Xiaomi e Realme configurados para você.",
    badge: "RegTech Shop",
    buttonLabel: "Comprar agora",
    actionType: "section",
    actionValue: "celulares",
    iconName: "Smartphone",
    backgroundImageUrl: null,
    backgroundMobileImageUrl: null,
    overlayOpacity: 0.35,
    textAlign: "left",
    active: true,
    displayOrder: 1,
    autoplaySeconds: 5,
  },
  {
    id: "default-3",
    title: "Internet Starlink onde você estiver",
    subtitle: "Instalação completa em Tucumã e Ourilândia.",
    badge: "RegTech Shop",
    buttonLabel: "Comprar agora",
    actionType: "section",
    actionValue: "informatica",
    iconName: "SatelliteDish",
    backgroundImageUrl: null,
    backgroundMobileImageUrl: null,
    overlayOpacity: 0.35,
    textAlign: "left",
    active: true,
    displayOrder: 2,
    autoplaySeconds: 5,
  },
  {
    id: "default-4",
    title: "Mobilidade elétrica e drones",
    subtitle: "Motos elétricas e DJI com orientação especializada.",
    badge: "RegTech Shop",
    buttonLabel: "Comprar agora",
    actionType: "section",
    actionValue: "eletronicos",
    iconName: "Bike",
    backgroundImageUrl: null,
    backgroundMobileImageUrl: null,
    overlayOpacity: 0.35,
    textAlign: "left",
    active: true,
    displayOrder: 3,
    autoplaySeconds: 5,
  },
];
