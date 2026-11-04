# Backend do DMS

## Autenticacao JWT

As rotas `/upload`, `/documents` e `/documents/:id/download` exigem um token no cabecalho `Authorization: Bearer <token>`. O DMS valida tokens emitidos por um servico de identidade externo; esta API nao possui rota de login nem emite tokens.

O token deve:

- Ser assinado com `HS256` usando o segredo compartilhado configurado em `JWT_SECRET`.
- Conter `iss` e `aud` iguais a `JWT_ISSUER` e `JWT_AUDIENCE`.
- Conter `sub` como identificador nao vazio do usuario, com no maximo 128 caracteres.
- Conter `exp` valido. Tokens expirados, com assinatura invalida ou claims incorretas recebem HTTP 401.

Configure as variaveis no ambiente do backend. `JWT_SECRET` deve ter pelo menos 32 bytes e corresponder ao segredo usado pelo emissor. Gere um segredo forte fora do repositorio, por exemplo com `openssl rand -hex 32`. Nunca grave o segredo real no codigo ou no Git.

```sh
export JWT_SECRET='<segredo compartilhado>'
export JWT_ISSUER='<issuer configurado no provedor>'
export JWT_AUDIENCE='dms-api'
npm start
```

O dono dos documentos e obtido exclusivamente do claim `sub` validado; o cabecalho `X-User-Id` nao e usado para autenticacao.