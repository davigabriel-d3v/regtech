import { Link } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [
    { title: "Política de Privacidade | RegTech" },
    { name: "description", content: "Política de Privacidade e proteção de dados da RegTech Cell Shop." },
  ]}),
  component: Privacidade,
});

function Privacidade() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <article className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar ao site</Link>
        <div className="mt-6 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><LockKeyhole className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">LGPD</p><h1 className="font-display text-3xl font-bold">Política de Privacidade</h1></div></div>
        <p className="mt-5 text-sm text-muted-foreground">Versão: 02/10/2026 · Última atualização: 02/10/2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
          <section><h2 className="font-display text-xl font-bold text-foreground">1. Quem controla os dados</h2><p className="mt-2">Controlador: RegTech Celulares, CNPJ 16.804.160/0001-23, Av. dos Estados, 241, Centro, Tucumã-PA. Este documento descreve como dados pessoais são tratados nas contas, no catálogo, em pedidos e nos canais digitais da RegTech.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">2. Quais dados podem ser tratados</h2><p className="mt-2">Dependendo do recurso utilizado, podem ser tratados: nome, e-mail, WhatsApp/telefone, credenciais de autenticação de forma protegida, dados de pedidos e atendimento, identificadores técnicos necessários ao funcionamento e preferências do site. A RegTech procura limitar a coleta ao que seja pertinente e necessário para cada finalidade.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">3. Para que usamos os dados</h2><p className="mt-2">Os dados podem ser usados para criar e administrar a conta, autenticar o usuário, atender solicitações, processar pedidos e contatos comerciais, enviar comunicações solicitadas, manter a segurança da plataforma, cumprir obrigações legais e exercer direitos em processos administrativos ou judiciais, quando aplicável.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">4. Bases legais</h2><p className="mt-2">Conforme a finalidade, o tratamento pode se apoiar em consentimento, execução de contrato ou procedimentos preliminares, cumprimento de obrigação legal ou regulatória, exercício regular de direitos, legítimo interesse e outras hipóteses previstas na LGPD. Quando o consentimento for necessário, ele será solicitado de forma destacada e poderá ser revogado nos termos da legislação.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">5. Compartilhamento e prestadores</h2><p className="mt-2">Dados podem ser tratados por prestadores de tecnologia necessários para hospedagem, autenticação, banco de dados, armazenamento, segurança e operação da plataforma, sempre dentro das finalidades aplicáveis e das obrigações de proteção de dados. Também poderá haver compartilhamento quando exigido por lei, ordem de autoridade competente ou para proteção de direitos.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">6. Transferências internacionais</h2><p className="mt-2">Alguns fornecedores de infraestrutura e tecnologia podem processar dados fora do Brasil. Quando houver transferência internacional de dados, a RegTech deverá observar a LGPD e os mecanismos previstos pela regulamentação da ANPD aplicáveis ao caso, além de informar as salvaguardas relevantes de forma transparente.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">7. Segurança</h2><p className="mt-2">A RegTech adota medidas técnicas e administrativas para reduzir riscos de acesso não autorizado, perda, alteração, destruição ou divulgação indevida. O sistema utiliza autenticação e controles de acesso por função; dados de credenciais não são tratados pela RegTech como texto simples na aplicação. Apesar das medidas adotadas, não existe segurança absoluta em serviços digitais.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">8. Retenção e eliminação</h2><p className="mt-2">Os dados são mantidos pelo período necessário às finalidades informadas e pelo tempo adicional exigido por obrigações legais, defesa de direitos, prevenção a fraudes ou outras hipóteses admitidas pela legislação. Após o encerramento das finalidades, os dados serão eliminados, anonimizados ou mantidos somente quando houver fundamento legal para conservação.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">9. Direitos do titular</h2><p className="mt-2">Nos termos da LGPD, o titular pode solicitar, conforme aplicável: confirmação da existência de tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade, portabilidade, informações sobre compartilhamentos, informação sobre a possibilidade de não fornecer consentimento, revogação do consentimento e demais direitos previstos em lei.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">10. Como solicitar atendimento sobre seus dados</h2><p className="mt-2">Solicitações de privacidade devem ser encaminhadas pelos canais oficiais da RegTech disponibilizados no site, com informações suficientes para identificação da solicitação. A equipe poderá pedir dados adicionais quando necessários para evitar atendimento indevido a terceiros.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">11. Atualizações</h2><p className="mt-2">Esta Política poderá ser atualizada para refletir mudanças de serviço, tecnologia ou legislação. A versão vigente ficará disponível nesta página e mudanças relevantes poderão ser comunicadas aos usuários.</p></section>
        </div>
      </article>
    </main>
  );
}
