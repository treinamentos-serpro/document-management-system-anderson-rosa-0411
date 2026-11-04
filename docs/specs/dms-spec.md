# Especificacao - Document Management System

> Especificacao funcional e tecnica para orientar a implementacao futura do DMS.
> Este documento nao implementa nem altera arquivos de backend ou frontend.

## 1. Objetivo

Entregar uma aplicacao web simples para que usuarios enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memoria.

## 2. Escopo

### Dentro do escopo

- Enviar um arquivo por requisicao e associar o documento a um identificador simples de usuario.
- Listar somente os documentos associados ao usuario da requisicao.
- Baixar um documento pelo identificador, respeitando o mesmo isolamento por usuario.
- Apresentar no frontend os controles de envio, listagem e download.
- Gravar os arquivos localmente com `multer` e `diskStorage` na pasta `backend/storage`.
- Manter os metadados em memoria durante a execucao do processo.

### Fora do escopo

- Autenticacao, autorizacao baseada em credenciais ou cadastro persistente de usuarios. O identificador de usuario desta fase serve apenas para separar dados em um ambiente simples e nao representa uma barreira de seguranca.
- Armazenamento externo ou em nuvem, banco de dados, distribuicao entre varias instancias ou recuperacao de metadados apos reinicio.
- Exclusao, versionamento, compartilhamento, busca, pre-visualizacao ou edicao de documentos.
- Upload de multiplos arquivos em uma unica requisicao.

### Premissas

- O cliente fornece um identificador de usuario nao vazio no cabecalho `X-User-Id`. Na interface desta fase, esse identificador pode ser informado como identidade de demonstracao; nao ha criacao nem validacao de contas.
- A API do backend usa os caminhos descritos abaixo sem prefixo. Durante o desenvolvimento, o frontend chama `/api/...` e o proxy do Vite remove `/api` antes de encaminhar a requisicao ao backend.
- Qualquer tipo de arquivo e aceito nesta fase, sujeito ao limite de tamanho configurado. O nome original e informativo e nunca e usado como caminho de armazenamento.
- O tamanho maximo inicial e 10 MiB e pode ser alterado por variavel de ambiente.
- Os nomes internos dos arquivos sao gerados pelo servidor. A API nao expoe o caminho local nem a chave interna de armazenamento.

## 3. Requisitos funcionais

| ID | Requisito | Criterio de aceite |
| --- | --- | --- |
| RF-01 | O usuario pode enviar um documento associado ao valor de `X-User-Id`. | Um upload valido cria um identificador unico, grava o arquivo localmente e retorna os metadados com HTTP 201. |
| RF-02 | O usuario pode listar seus documentos. | `GET /documents` retorna somente documentos cujo campo `owner` corresponde ao `X-User-Id` informado; uma lista sem resultados e valida. |
| RF-03 | O usuario pode baixar um documento pelo identificador. | Um documento existente pertencente ao usuario e retornado como anexo binario com o nome original. |
| RF-04 | O sistema valida os dados obrigatorios do upload. | Requisicao sem arquivo, com mais de um arquivo, sem `X-User-Id` ou acima do limite e rejeitada com erro HTTP documentado, sem metadado parcial. |
| RF-05 | O sistema isola as operacoes por usuario. | Um usuario nao consegue listar nem baixar documentos de outro; documento inexistente e documento de outro usuario retornam a mesma resposta 404. |
| RF-06 | O frontend permite operar o fluxo principal. | A tela permite informar a identidade simples da demonstracao, enviar arquivo, consultar a lista e iniciar o download, exibindo estados de carregamento, lista vazia e erro. |

## 4. Requisitos nao funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local da aplicacao, em `backend/storage`, usando `multer` com `diskStorage`; nao usar provedores externos. |
| RNF-02 | Os metadados devem permanecer em memoria. Reiniciar o processo limpa a lista de metadados; nao ha garantia de associar arquivos existentes a registros depois do reinicio. |
| RNF-03 | A configuracao de ambiente deve seguir 12-Factor. `PORT` define a porta do backend (padrao `3000`); `MAX_FILE_SIZE_BYTES` define o limite (padrao `10485760`). O diretorio local deve ter um valor padrao apontando para `backend/storage`; qualquer customizacao continua restrita a filesystem local. |
| RNF-04 | O servidor deve gerar IDs e nomes internos seguros e nao deve aceitar caminhos fornecidos pelo cliente para leitura, escrita ou download. |
| RNF-05 | Falhas de validacao e operacao devem ser respondidas em JSON consistente, sem expor caminhos internos, stack traces ou detalhes sensiveis. |
| RNF-06 | A interface deve usar `fetch` pelo prefixo `/api`, mantendo a configuracao de proxy existente no Vite. |
| RNF-07 | Os testes do backend devem usar o runner nativo `node:test`. |
| RNF-08 | O sistema deve permanecer simples, sem TypeScript e sem introduzir dependencias de persistencia externa ou servicos de upload de terceiros. |

## 5. Modelo de dados

### Metadados publicos do documento

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `id` | string (UUID) | Sim | Identificador unico gerado pelo servidor. |
| `originalName` | string | Sim | Nome original fornecido pelo cliente; usado apenas para exibicao e nome do download. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string (ISO 8601 UTC) | Sim | Data e hora em que o upload foi concluido. |
| `owner` | string | Sim | Valor normalizado de `X-User-Id` associado ao documento. |

### Registro interno

- A camada de repositorio mantem os metadados em memoria, indexados por `id`.
- O registro interno tambem mantem uma chave de armazenamento gerada pelo servidor, suficiente para localizar o arquivo dentro do diretorio configurado. Essa chave e privada e nao aparece nas respostas da API.
- A camada de repositorio e responsavel pelo acesso ao arquivo e pela colecao de metadados. O controller nao deve conhecer detalhes do filesystem.
- Se a gravacao do arquivo for concluida, mas o registro dos metadados falhar, o arquivo recem-gravado deve ser removido para evitar um upload parcialmente registrado.

## 6. Contratos de API

### Convencoes gerais

- `Content-Type` para respostas JSON: `application/json; charset=utf-8`.
- Todas as operacoes de documentos exigem `X-User-Id`, com valor apos remover espacos laterais e entre 1 e 128 caracteres. A ausencia ou invalidade do valor retorna HTTP 400.
- O identificador do usuario e um contexto funcional de demonstracao, nao uma credencial. A API nao oferece protecao contra falsificacao desse cabecalho.
- Formato de erro:

```json
{
  "error": {
    "code": "MISSING_FILE",
    "message": "Envie um arquivo para continuar."
  }
}
```

### `POST /upload`

- Cabecalho obrigatorio: `X-User-Id`.
- Entrada: `multipart/form-data` com exatamente um campo de arquivo chamado `file`.
- Limite: `MAX_FILE_SIZE_BYTES` (padrao 10 MiB).
- Armazenamento: arquivo escrito por `multer`/`diskStorage` em `backend/storage`, com nome interno gerado pelo servidor.
- Sucesso: HTTP 201, corpo contendo os metadados publicos do documento.

Exemplo de resposta:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 2048,
  "uploadedAt": "2026-11-04T12:00:00.000Z",
  "owner": "usuario-demo"
}
```

Erros esperados: HTTP 400 para arquivo ausente, campo invalido ou usuario ausente/invalido; HTTP 413 para arquivo acima do limite; HTTP 500 para falha local de armazenamento. Nenhum desses erros deve retornar metadados de sucesso.

### `GET /documents`

- Cabecalho obrigatorio: `X-User-Id`.
- Entrada: sem corpo.
- Sucesso: HTTP 200, documentos do usuario em ordem decrescente de `uploadedAt`.
- Lista vazia: HTTP 200 com `{"documents": []}`.

Exemplo de resposta:

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 2048,
      "uploadedAt": "2026-11-04T12:00:00.000Z",
      "owner": "usuario-demo"
    }
  ]
}
```

Erro esperado: HTTP 400 para usuario ausente/invalido; HTTP 500 para falha inesperada de leitura dos metadados.

### `GET /documents/:id/download`

- Cabecalho obrigatorio: `X-User-Id`.
- Entrada: `id` do documento na URL; sem corpo.
- Sucesso: HTTP 200 com o conteudo binario e `Content-Disposition: attachment`, usando o nome original como nome de download. O nome original deve ser tratado como valor de cabecalho, nunca como caminho.
- Erro: HTTP 404 com codigo `DOCUMENT_NOT_FOUND` se o documento nao existir, nao pertencer ao usuario ou se o arquivo local nao estiver disponivel.
- Erro: HTTP 400 se `X-User-Id` estiver ausente ou invalido.

### Codigos de erro

| HTTP | Codigo | Situacao |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | Cabecalho, campo ou entrada obrigatoria ausente/invalida. |
| 413 | `FILE_TOO_LARGE` | O arquivo excede `MAX_FILE_SIZE_BYTES`. |
| 404 | `DOCUMENT_NOT_FOUND` | ID inexistente, de outro usuario ou arquivo indisponivel. |
| 500 | `INTERNAL_ERROR` | Falha inesperada; mensagem generica sem detalhes internos. |

## 7. Decisoes arquiteturais

### Backend

- Manter a dependencia na direcao `routes -> controllers -> services -> repositories`.
- `routes/`: declarar endpoints e aplicar o middleware de upload com `multer`/`diskStorage` no endpoint de upload.
- `controllers/`: validar entrada HTTP, obter `X-User-Id`, chamar o servico e traduzir resultados para status, cabecalhos e corpos HTTP.
- `services/`: aplicar regras de negocio, incluindo associacao ao usuario, filtragem por dono e coordenacao de metadados e arquivo.
- `repositories/`: manter metadados em memoria e encapsular a localizacao, leitura e remocao compensatoria de arquivos locais.
- Camadas internas nao devem depender de Express, de objetos de requisicao/resposta ou do middleware Multer.

### Frontend

- Usar React com componentes funcionais e Hooks, mantendo a organizacao existente em `components/`, `pages/` e `services/`.
- A camada de servico centraliza as chamadas `fetch` para `/api/upload`, `/api/documents` e `/api/documents/:id/download`, incluindo o cabecalho `X-User-Id`.
- A pagina de documentos coordena a identidade de demonstracao, envio, atualizacao da lista, estados vazios e exibicao de erros. O download deve tratar a resposta como binario.

### Tratamento de arquivos e dados

- O middleware Multer e responsavel por receber e gravar o arquivo. O servico valida o contexto e coordena o registro dos metadados; o repositorio encapsula a persistencia local e em memoria.
- O nome original nao e usado para compor o caminho fisico. O ID/chave de armazenamento e gerado pela aplicacao.
- O download e sempre uma resposta de anexo, nao uma rota para servir arquivos arbitrarios.
- Como os metadados sao volateis, arquivos presentes no disco apos um reinicio podem ficar sem registro. Recuperacao e limpeza automatica desses arquivos nao fazem parte desta fase.

## 8. Plano de execucao

As etapas abaixo descrevem trabalho futuro. Este pedido cria somente este documento; nenhum arquivo de backend ou frontend deve ser implementado como parte dele. Os caminhos sao alvos previstos e podem ser ajustados para seguir o estado do repositorio no momento de cada etapa.

1. **Preparar contratos e configuracao do backend**
   - Arquivos previstos: `backend/package.json`, `backend/src/app.js` e configuracao de upload em `backend/src/routes/`.
   - Atividades: confirmar/adicionar Multer; registrar middleware de erro e rotas; configurar porta, limite e diretorio local; garantir criacao segura do diretorio.
   - Aceite: app continua exportavel para testes, `/health` continua funcionando, limites/configuracoes possuem valores padrao e upload usa `diskStorage` local.

2. **Implementar o fluxo de documentos no backend**
   - Arquivos previstos: `backend/src/routes/`, `backend/src/controllers/`, `backend/src/services/` e `backend/src/repositories/`.
   - Atividades: implementar upload, listagem por dono, download por ID e formato de erros; manter caminho de arquivo fora da resposta publica.
   - Aceite: os tres contratos desta especificacao funcionam; IDs de outros usuarios nao podem ser baixados; falhas nao deixam metadados parciais nem arquivos recem-criados orfaos.

3. **Cobrir o backend com testes**
   - Arquivos previstos: `backend/test/app.test.js` e, se necessario, arquivos adicionais em `backend/test/`.
   - Atividades: testar status e corpos de sucesso, validacoes, isolamento entre usuarios, limite de upload, arquivo ausente e arquivo indisponivel; limpar arquivos temporarios ao final dos testes.
   - Aceite: `cd backend && npm test` passa sem depender de servicos externos nem deixar arquivos de teste em `backend/storage`.

4. **Implementar a experiencia de frontend**
   - Arquivos previstos: `frontend/src/services/`, `frontend/src/pages/`, `frontend/src/components/` e `frontend/src/App.jsx`.
   - Atividades: integrar os endpoints usando `/api`, permitir informar a identidade de demonstracao, enviar um arquivo, renderizar a lista e iniciar download; tratar carregamento, lista vazia e erros.
   - Aceite: o fluxo principal pode ser concluido pelo navegador usando o proxy existente do Vite; respostas de erro nao sao apresentadas como sucesso.

5. **Validar integracao e atualizar documentacao de uso**
   - Arquivos previstos: testes existentes, `README.md` e eventualmente configuracao local de ambiente, se adotada pelo projeto.
   - Atividades: validar backend e frontend integrados, confirmar comportamento com reinicio e documentar comandos, variaveis de ambiente e limitacoes de persistencia/autenticacao.
   - Aceite: comandos de desenvolvimento e verificacao estao documentados; upload, listagem e download funcionam ponta a ponta; limitacoes desta especificacao estao visiveis.