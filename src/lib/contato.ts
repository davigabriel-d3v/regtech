// WhatsApp principal de vendas (Tucumã)
export const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=5594992989833&text&type=phone_number&app_absent=0";

export function whatsappComMensagem(texto: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(texto)}`;
}
