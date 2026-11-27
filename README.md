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

## Publicar em VPS com Ubuntu e Nginx

### 1. Preparar o DNS e o build

1. Aponte os registros DNS `A` do dominio (e `www`, se usar) para o IPv4 do VPS.
2. Crie `.env.local` a partir de `.env.example` e informe a URL do projeto Supabase e a chave publica `anon`/`publishable`. Essa chave e usada no navegador; nunca coloque a `service_role` no frontend.
3. Execute `npm ci`, `npm test` e `npm run build:vps`. O site sera compilado para a raiz do dominio e os arquivos ficarao em `dist/`.

### 2. Instalar Nginx no VPS

Em Ubuntu/Debian:

```sh
sudo apt update
sudo apt install -y nginx
sudo mkdir -p /var/www/pontofacil/dist
sudo chown -R "$USER":www-data /var/www/pontofacil
sudo chmod -R 755 /var/www/pontofacil
```

Copie o conteudo da pasta local `dist/` para `/var/www/pontofacil/dist/` usando SFTP ou:

```sh
scp -r dist/* usuario@IP_DO_VPS:/var/www/pontofacil/dist/
```

### 3. Configurar o site

1. Copie `deploy/nginx.conf` para `/etc/nginx/sites-available/pontofacil`.
2. Substitua `seu-dominio.com` e `www.seu-dominio.com` pelo dominio real.
3. Ative e valide a configuracao:

```sh
sudo ln -s /etc/nginx/sites-available/pontofacil /etc/nginx/sites-enabled/pontofacil
sudo nginx -t
sudo systemctl reload nginx
```

Se o link ja existir, nao o crie novamente. Libere as portas 80 e 443 no firewall do VPS e no firewall do provedor.

### 4. Ativar HTTPS

Depois que o DNS apontar para o VPS e o site responder em HTTP:

```sh
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
sudo certbot renew --dry-run
```

O HTTPS e necessario para camera e geolocalizacao nos celulares dos colaboradores.

### 5. Permitir o dominio no Supabase

No Supabase, abra **Authentication > URL Configuration**:

- defina `https://seu-dominio.com/` como **Site URL**;
- adicione `https://seu-dominio.com/**` e, se usado, `https://www.seu-dominio.com/**` em **Redirect URLs**.

Teste o login, primeiro acesso, recuperacao de senha, camera e localizacao no dominio HTTPS. O Supabase continua hospedando autenticacao e banco; o Nginx apenas serve o frontend.

## Validacao e implantacao no GitHub Pages

1. Execute `npm run test`.
2. Execute `npm run build`.
3. Para GitHub Pages, use `npm run build` e publique o conteudo de `dist/`.
4. Configure o dominio permitido em Authentication > URL Configuration no Supabase.
