---
description: Integra uma funcionalidade ao frontend React do DMS usando a API existente.
name: integrar-frontend
argument-hint: funcionalidade a integrar (ex. atualizar a lista após uma ação)
agent: agent
---

# Integrar funcionalidade do frontend

Implemente ou atualize a funcionalidade `${input:funcionalidade:descreva a funcionalidade}` no frontend do Document Management System.

Antes de editar:

- Consulte `docs/specs/dms-spec.md` e `.github/copilot-instructions.md`.
- Inspecione os componentes, serviços e estilos próximos para seguir os padrões existentes.

Requisitos:

- Use React com componentes funcionais e Hooks, JavaScript ESM e a organização existente em `frontend/src/components`, `frontend/src/pages` e `frontend/src/services`.
- Reutilize `frontend/src/services/documentsApi.js` para as operações já disponíveis. Chamadas novas devem usar `fetch` pelo prefixo `/api` e enviar `X-User-Id` quando exigido pelo contrato.
- Mantenha chamadas HTTP e tratamento de respostas no serviço; deixe componentes responsáveis pela apresentação e interação, evitando duplicar lógica.
- Trate estados de carregamento, vazio, sucesso e erro conforme aplicável. Preserve acessibilidade, responsividade e o visual existente.
- Não altere o backend nem adicione dependências, a menos que a funcionalidade solicitada exija isso explicitamente.
- Preserve alterações existentes não relacionadas e mantenha o escopo limitado à funcionalidade solicitada.

Validação:

- Execute `cd frontend && npm run build`.
- Corrija erros introduzidos pela implementação e informe o resultado da validação.
