import { Instagram, Mail, MapPin, MessageCircle, Phone, ShieldCheck, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/regtech-logo.png";
import { SeloVerificado } from "@/components/SeloVerificado";

const contatos = [
  { label: "Vendas • Tucumã", phone: "55 94 99298-9833", href: "https://api.whatsapp.com/send/?phone=5594992989833&text&type=phone_number&app_absent=0" },
  { label: "Vendas • Ourilândia", phone: "55 94 99297-5433", href: "https://api.whatsapp.com/send/?phone=5594992975433&text&type=phone_number&app_absent=0" },
  { label: "Assistência Técnica", phone: "55 94 99286-7788", href: "https://api.whatsapp.com/send/?phone=5594992867788&text&type=phone_number&app_absent=0" },
  { label: "Vendas • Atacado", phone: "55 94 99204-2215", href: "https://api.whatsapp.com/send/?phone=5594992042215&text&type=phone_number&app_absent=0" },
];

export function RodapeRegTech() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo da RegTech" className="h-10 w-10 rounded-full" />
              <div>
                <p className="inline-flex items-center font-display text-lg font-bold">Reg<span className="text-primary">Tech</span><SeloVerificado /></p>
                <p className="text-xs text-muted-foreground">Tecnologia que faz avançar</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Tecnologia, assistência técnica, conectividade e soluções digitais para sua casa e sua empresa.
            </p>
            <a href="https://www.instagram.com/regtechcellshop/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
              <Instagram className="h-4 w-4" /> @regtechcellshop
            </a>
          </div>

          <div>
            <h3 className="font-display font-semibold">Navegue</h3>
            <nav className="mt-4 grid gap-2.5 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">Início</Link>
              <Link to="/shop" className="hover:text-primary">Shop RegTech</Link>
              <Link to="/carrinho" className="hover:text-primary">Carrinho</Link>
              <Link to="/resgatar" className="hover:text-primary">Resgatar cupom</Link>
              <Link to="/conta" className="hover:text-primary">Minha conta</Link>
            </nav>
          </div>

          <div>
            <h3 className="font-display font-semibold">Atendimento</h3>
            <div className="mt-4 grid gap-3">
              {contatos.slice(0, 3).map((contato) => (
                <a key={contato.label} href={contato.href} target="_blank" rel="noreferrer" className="group flex items-start gap-2.5 text-sm text-muted-foreground hover:text-primary">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><span className="block font-medium text-foreground group-hover:text-primary">{contato.label}</span><span>{contato.phone}</span></span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold">Informações</h3>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <div className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Tucumã-PA / Ourilândia-PA</span></div>
              <div className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Atendimento local e regional</span></div>
              <div className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Fale conosco pelo WhatsApp</span></div>
              <div className="flex gap-2.5"><ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Produtos, serviços e assistência</span></div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 py-6">
          <div className="flex flex-col gap-4 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
              <Link to="/termos" className="hover:text-foreground hover:underline">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-foreground hover:underline">Privacidade</Link>
              <Link to="/cookies" className="hover:text-foreground hover:underline">Cookies</Link>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Compra e atendimento com suporte RegTech</span>
            </div>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              <a href="https://www.instagram.com/_davhz.xn/" target="_blank" rel="noreferrer" className="hover:text-foreground hover:underline">By @_davhz.xn</a>
              <span>© {new Date().getFullYear()} RegTech. Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
