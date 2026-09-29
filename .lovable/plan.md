# Corrigir “Invalid token” ao criar acessos no Vercel

## Objetivo
Fazer a criação de acessos validar corretamente a sessão administrativa quando o site estiver hospedado no Vercel, sem alterar as telas ou permissões existentes.

## Alterações
- Trocar a validação local frágil do token por validação direta no serviço de autenticação, mantendo a exigência de administrador.
- Fazer a chamada protegida renovar uma sessão vencida ou inconsistente antes de enviar o token.
- Retornar mensagens claras para sessão expirada e configuração ausente no Vercel.
- Documentar as variáveis obrigatórias do Vercel sem incluir valores secretos.

## Validação
- Confirmar que o projeto compila.
- Testar listagem e criação de acesso autenticado no ambiente disponível.
- Confirmar que chamadas sem sessão continuam bloqueadas.

## Observação técnica
A criação de usuários exige também a credencial administrativa configurada apenas no servidor do Vercel; ela nunca será enviada ao navegador ou incluída no código.
