// TODO: trocar pelo número real do WhatsApp da RegTech (com DDD)
export const WHATSAPP_URL = "https://wa.me/5594999999999";

export function whatsappComMensagem(texto: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(texto)}`;
}
