import { Link } from "@tanstack/react-router";
import { ArrowLeft, Cookie } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [
    { title: "Política de Cookies | RegTech" },
    { name: "description", content: "Política de Cookies da RegTech Cell Shop." },
  ]}),
  component: Cookies,
});

function Cookies() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <article className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar ao site</Link>
        <div className="mt-6 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><Cookie className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Preferências</p><h1 className="font-display text-3xl font-bold">Política de Cookies</h1></div></div>
        <p className="mt-5 text-sm text-muted-foreground">Versão: 02/10/2026 · Última atualização: 02/10/2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
          <section><h2 className="font-display text-xl font-bold text-foreground">1. O que são cookies</h2><p className="mt-2">Cookies são pequenos arquivos e identificadores armazenados no navegador para permitir ou melhorar determinados recursos. Tecnologias semelhantes, como armazenamento local, também podem cumprir funções equivalentes de preferência e sessão.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">2. Como usamos</h2><p className="mt-2">No estado atual da plataforma, utilizamos tecnologias essenciais para autenticação, manutenção de sessão, preferências e funcionamento seguro da navegação. Não condicionamos o acesso a cookies de publicidade.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">3. Cookies opcionais</h2><p className="mt-2">Caso sejam adicionadas tecnologias de medição, personalização ou marketing que não sejam necessárias ao funcionamento do serviço, o consentimento poderá ser solicitado de forma separada e o usuário poderá recusá-las.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">4. Como mudar sua escolha</h2><p className="mt-2">A preferência apresentada no banner de cookies pode ser alterada futuramente por um novo controle de preferências disponibilizado no site. O usuário também pode apagar dados armazenados no navegador pelas configurações do próprio dispositivo.</p></section>
          <section><h2 className="font-display text-xl font-bold text-foreground">5. Transparência</h2><p className="mt-2">A RegTech mantém esta política para explicar, de forma clara, as tecnologias usadas e os critérios de consentimento aplicáveis. A política será atualizada quando o uso de cookies mudar.</p></section>
        </div>
      </article>
    </main>
  );
}
