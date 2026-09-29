# RegTech

Faça um site com essa logo e quero que o site tenham as cores da logo

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c875d139-ac11-401a-826b-ca7d16460737).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


## Deploy no Vercel

O frontend usa Supabase Auth e Edge Functions. Configure no projeto Vercel, em **Settings → Environment Variables**, para **Production, Preview e Development** conforme o ambiente:

- `VITE_SUPABASE_URL`: URL pública do projeto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave pública `sb_publishable_...` do projeto Supabase.

O código também aceita `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` como fallback para ambientes SSR. Para este frontend Vite, prefira sempre as variáveis `VITE_*`.

**Nunca** coloque `SUPABASE_SERVICE_ROLE_KEY` em uma variável `VITE_*` nem no código do navegador.

### Sessão e Edge Functions

A sessão é persistida no navegador e renovada automaticamente. As chamadas protegidas para `manage-access` agora renovam a sessão antes da chamada e enviam explicitamente `Authorization: Bearer <access_token>`. Isso evita depender apenas da descoberta automática de sessão do cliente durante a validação JWT da Edge Function.

Depois de alterar variáveis no Vercel, faça um novo deployment. Uma sessão antiga também pode precisar ser encerrada e refeita após mudanças de ambiente.

### Checklist do Acesso +

1. Entrar com uma conta que tenha `user_roles.role = 'admin'`.
2. Abrir **Acesso +**.
3. Criar um operador com e-mail, senha de pelo menos 6 caracteres e módulos.
4. A Edge Function `manage-access` deve estar ativa com JWT obrigatório.
5. Se aparecer “Sessão expirada”, sair e entrar novamente.
6. Se aparecer erro de variável Supabase ausente, corrigir as variáveis do Vercel e gerar novo deployment.
