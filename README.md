# LumiKids

<p align="center">
  <img src="assets/cover.png" alt="LumiKids cover" width="100%" />
</p>

LumiKids e uma plataforma infantil em React/Vite com jogos educativos, historias, imprimiveis, favoritos e acompanhamento de progresso. O frontend roda separado da API para facilitar deploy, manutencao e testes.

## URLs oficiais

- Site: https://lumikids.vercel.app
- API: https://lumikids-backend.vercel.app
- Repositorio backend: https://github.com/Juanblack1/LumiKids-Backend

## Contas demo

Use essas contas para validar todos os fluxos sem criar dados reais.

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Crianca | `luna@lumikids.com` | `123456` |
| Responsavel | `familia@lumikids.com` | `123456` |

## Funcionalidades

- Login por perfil de crianca ou responsavel.
- Catalogo com jogos, historias, atividades escolares e imprimiveis.
- Jogos interativos com registro de progresso.
- Historias com leitura, escolhas e conteudo para imprimir.
- Favoritos persistidos por usuario.
- Rotas publicas preparadas para acesso direto na Vercel.

## Requisitos

- Node.js 22
- npm
- Backend LumiKids publicado ou rodando localmente

## Configuracao local

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_API_BASE_URL=http://localhost:4300
```

Para testar contra a API publicada, use:

```env
VITE_API_BASE_URL=https://lumikids-backend.vercel.app
```

## Scripts

```bash
npm ci
npm run dev
npm run lint
npm run test
npm run build
npm run preview
npm audit --omit=dev
```

## QA recomendado

Antes de publicar alteracoes, rode:

```bash
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

Depois valide no navegador:

- `/`, `/login`, `/catalog`, `/games`, `/stories` e `/printables` carregam sem erro.
- Login da crianca redireciona para o catalogo.
- Login do responsavel abre a mesma experiencia com o perfil correto.
- Favoritar e desfavoritar itens atualiza a interface.
- Jogar uma atividade registra progresso.
- Historias e imprimiveis abrem os detalhes e a acao de imprimir.
- Logout encerra a sessao.

## Deploy na Vercel

O projeto Vercel oficial e `lumikids`.

Variavel configurada em producao:

```env
VITE_API_BASE_URL=https://lumikids-backend.vercel.app
```

O arquivo `vercel.json` redireciona rotas de SPA para `index.html`, permitindo acesso direto a rotas como `/login` e `/catalog`.

## CI

O GitHub Actions executa em push para `main`:

- `npm ci`
- `npm run test`
- `npm run build`
- `npm audit --omit=dev`
