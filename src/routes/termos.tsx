import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [
    { title: "Termos de Uso | RegTech" },
    { name: "description", content: "Termos de Uso da RegTech Cell Shop." },
  ]}),
  component: Termos,
});

function Termos() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <article className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar ao site</Link>
        <div className="mt-6 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><FileText className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Documento</p><h1 className="font-display text-3xl font-bold">Termos de Uso</h1></div></div>
        <p className="mt-5 text-sm text-muted-foreground">Versão: 02/10/2026 · Última atualização: 02/10/2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
          <section><h2 className="font-display text-xl font-bold text-foreground">1. Identificação</h2><p className="mt-2">A plataforma é operada pela RegTech Celulares, CNPJ 16.804.160/0001-23, com endereço comercial na Av. dos Estados, 241, Centro, Tucumã-PA. O contato para atendimento e solicitações relacionadas a esta plataforma pode ser realizado pelos canais oficiais divulgados no site, inclusive WhatsApp.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">2. Aceitação</h2><p className="mt-2">Ao criar uma conta ou utilizar áreas que dependam de autenticação, o usuário declara que leu estes Termos de Uso e a Política de Privacidade e concorda com suas condições. A aceitação é registrada junto aos dados da conta, com a versão do documento e a data do aceite.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">3. Cadastro e segurança da conta</h2><p className="mt-2">O usuário deve fornecer informações verdadeiras, manter seus dados atualizados e proteger suas credenciais. A RegTech adota controles técnicos e administrativos compatíveis com o risco do serviço, incluindo autenticação, controle de acesso e restrições de acesso aos dados. Nenhum ambiente digital pode oferecer garantia absoluta contra incidentes, por isso também é responsabilidade do usuário manter senha, dispositivo e e-mail protegidos.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">4. Uso permitido</h2><p className="mt-2">Não é permitido usar a plataforma para fraude, tentativa de acesso indevido, exploração de vulnerabilidades, envio de conteúdo ilícito, violação de direitos de terceiros ou qualquer atividade que comprometa o funcionamento e a segurança dos serviços.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">5. Produtos, preços e ofertas</h2><p className="mt-2">Informações de produtos, preços, estoque, promoções e disponibilidade podem ser alteradas. O envio de uma solicitação ou contato pelo site não constitui, por si só, confirmação de venda; a contratação será confirmada pelos canais comerciais da RegTech.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">6. Propriedade intelectual</h2><p className="mt-2">Logotipos, textos, identidade visual, componentes e demais conteúdos da plataforma, quando pertencentes à RegTech, são protegidos pela legislação aplicável. O uso da plataforma não transfere direitos de propriedade intelectual ao usuário.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">7. Privacidade e dados pessoais</h2><p className="mt-2">O tratamento de dados pessoais ocorre conforme a Política de Privacidade e a legislação aplicável, especialmente a LGPD. O usuário pode consultar as informações sobre finalidades, bases legais, compartilhamentos, retenção e seus direitos na Política de Privacidade.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">8. Alterações</h2><p className="mt-2">Os Termos podem ser atualizados para refletir mudanças legais, técnicas ou operacionais. Quando houver alteração relevante, a RegTech poderá destacar a nova versão no site ou solicitar novo aceite quando apropriado.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">9. Contato</h2><p className="mt-2">Para dúvidas, solicitações ou reclamações sobre a utilização da plataforma, utilize os canais oficiais da RegTech disponíveis no site. Para assuntos relacionados à privacidade, consulte a Política de Privacidade.</p></section>
        </div>
      </article>
    </main>
  );
}
