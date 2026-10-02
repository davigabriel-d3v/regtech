const WHATSAPP_PADRAO = "5594992989833";

export const WHATSAPP_URL = `https://api.whatsapp.com/send/?phone=${WHATSAPP_PADRAO}&text`;

export function whatsappComMensagem(texto: string, telefone = WHATSAPP_PADRAO): string {
  const numero = telefone.replace(/\D/g, "");
  const base = `https://api.whatsapp.com/send/?phone=${numero}&text`;
  return `${base}=${encodeURIComponent(texto)}`;
}
