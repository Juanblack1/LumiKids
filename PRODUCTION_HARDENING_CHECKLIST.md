# Production Hardening Checklist

## App and Infra
- [ ] Definir `JWT_SECRET` forte e exclusivo por ambiente
- [ ] Configurar `CLIENT_ORIGIN` para o dominio final
- [ ] Rodar backend por HTTPS atras de proxy confiavel
- [ ] Habilitar `secure` cookies em producao
- [ ] Rotacionar segredos e documentar dono/responsavel

## Backend Security
- [x] `helmet` ativo
- [x] `x-powered-by` desabilitado
- [x] CORS restrito ao origin permitido
- [x] Rate limit em login
- [x] Rate limit em escrita e progresso
- [x] Protecao CSRF via cookie + header
- [x] Limite de payload JSON
- [ ] Adicionar observabilidade e alertas para 401/403/429
- [ ] Adicionar lockout persistente por IP/usuario em ambiente publico

## Data and Privacy
- [ ] Definir politica de retencao para progresso e historico
- [ ] Revisar quais dados infantis realmente precisam ser armazenados
- [ ] Criar rotina de backup do SQLite ou migrar para banco gerenciado
- [ ] Documentar processo de exclusao de conta/dados

## Frontend Security
- [x] Cliente envia `x-csrf-token` em rotas mutaveis
- [ ] Revisar CSP no deploy final
- [ ] Revisar code splitting para reduzir bundle inicial
- [ ] Validar mais fluxos com testes E2E em CI

## Release Gate
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run audit`
- [ ] Smoke test de login, jogo, impressao e logout
