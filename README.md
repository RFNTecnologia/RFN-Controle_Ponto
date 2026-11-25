# PontoFacil

Aplicacao web de controle de ponto da RFNTecnologia, desenvolvida com React, Vite e Supabase.

## Configuracao

1. Instale as dependencias com `npm install`.
2. Copie `.env.example` para `.env.local` e informe a URL e a chave publica do projeto Supabase.
3. Execute o SQL de `supabase-schema.sql` no editor SQL do Supabase.
4. Crie o usuario administrador no Supabase Authentication usando o mesmo e-mail do perfil administrador.
5. Execute `npm run dev`.

## Validacao e implantacao

1. Execute `npm run test`.
2. Execute `npm run build`.
3. Publique o conteudo de `dist/` no GitHub Pages ou em outro servidor estatico.
4. Configure o dominio permitido em Authentication > URL Configuration no Supabase.
