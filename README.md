# PontoFacil

Aplicacao web de controle de ponto da RFNTecnologia, desenvolvida com React, Vite e Supabase.

## Configuracao

1. Instale as dependencias com `npm install`.
2. Copie `.env.example` para `.env.local` e informe a URL e a chave publica do projeto Supabase.
3. Execute o SQL de `supabase-schema.sql` no editor SQL do Supabase.
4. Crie o usuario administrador no Supabase Authentication usando o mesmo e-mail do perfil administrador.
5. Em Authentication > URL Configuration, configure a URL local de desenvolvimento e o dominio publicado em Redirect URLs.
6. Execute `npm run dev`.

## Acesso dos colaboradores

1. O administrador cadastra o colaborador no painel, usando o e-mail correto.
2. O colaborador abre **Primeiro acesso? Criar conta com convite** e informa o mesmo e-mail.
3. Se a confirmacao de e-mail estiver habilitada, o colaborador confirma pelo link enviado pelo Supabase e depois entra com a senha definida.
4. No celular, permita camera e localizacao para registrar o ponto. A captura dessas permissoes exige HTTPS fora de `localhost`.
5. Justificativas e ajustes de ponto ficam pendentes ate o administrador aprovar ou rejeitar em **Solicitacoes**.

## Validacao e implantacao

1. Execute `npm run test`.
2. Execute `npm run build`.
3. Publique o conteudo de `dist/` no GitHub Pages ou em outro servidor estatico.
4. Configure o dominio permitido em Authentication > URL Configuration no Supabase.
