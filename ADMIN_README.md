# Acesso ao painel administrativo

O painel não possui credenciais padrão. Configure os segredos no `.env` local ou no ambiente da hospedagem:

```env
ADMIN_USER=seu_usuario
ADMIN_PASS=sua_senha_com_ao_menos_16_caracteres
JWT_SECRET=uma_chave_aleatoria_com_ao_menos_32_bytes
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/BANCO?sslmode=require"
```

`ADMIN_PASS` deve ter pelo menos 16 caracteres e ser diferente de `ADMIN_USER`. Gere um `JWT_SECRET` aleatório e exclusivo para cada ambiente. Não versione o `.env` nem compartilhe esses valores em logs ou mensagens. O `.env.example` contém apenas o formato esperado.

## Preparar e executar localmente

Use Node.js compatível com a versão do Next.js do projeto e Yarn 4.10.3 via Corepack:

```bash
corepack enable
yarn install
yarn generate
yarn dev
```

Abra `http://localhost:3000/admin/login` e entre com `ADMIN_USER` e `ADMIN_PASS`. A configuração do banco usa PostgreSQL; as instruções antigas para SQLite e Basic Auth não se aplicam.

Depois de alterar variáveis no `.env`, reinicie `yarn dev` para o servidor carregar os novos valores.
