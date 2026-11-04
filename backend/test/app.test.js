const { after, before, test } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
const jwtSecret = 'test-secret-with-at-least-thirty-two-bytes';
const jwtIssuer = 'https://auth.example.test';
const jwtAudience = 'dms-api';
process.env.DMS_STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_BYTES = '10';
process.env.JWT_SECRET = jwtSecret;
process.env.JWT_ISSUER = jwtIssuer;
process.env.JWT_AUDIENCE = jwtAudience;

const app = require('../src/app');
let server;
let baseUrl;

function authorizationHeaders(subject, options = {}) {
  const signOptions = {
    algorithm: 'HS256',
    issuer: options.issuer ?? jwtIssuer,
    audience: options.audience ?? jwtAudience,
    expiresIn: options.expiresIn ?? '5m',
  };
  if (subject !== undefined) {
    signOptions.subject = subject;
  }

  const token = jwt.sign({}, options.secret ?? jwtSecret, signOptions);
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});

test('o app backend e exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa documentos com isolamento por usuario', async () => {
  const emptyList = await fetch(`${baseUrl}/documents`, {
    headers: authorizationHeaders('alice'),
  });
  assert.strictEqual(emptyList.status, 200);
  assert.deepStrictEqual(await emptyList.json(), { documents: [] });

  const formData = new FormData();
  formData.append('file', new Blob(['documento']), 'relatorio.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      ...authorizationHeaders('alice'),
      'X-User-Id': 'attacker',
    },
    body: formData,
  });
  assert.strictEqual(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.deepStrictEqual(Object.keys(document).sort(), [
    'id', 'originalName', 'owner', 'size', 'uploadedAt',
  ]);
  assert.strictEqual(document.owner, 'alice');
  assert.strictEqual(document.originalName, 'relatorio.txt');
  assert.strictEqual(document.size, 9);

  const aliceList = await fetch(`${baseUrl}/documents`, {
    headers: authorizationHeaders('alice'),
  });
  assert.deepStrictEqual((await aliceList.json()).documents.map(({ id }) => id), [document.id]);

  const bobList = await fetch(`${baseUrl}/documents`, {
    headers: {
      ...authorizationHeaders('bob'),
      'X-User-Id': 'alice',
    },
  });
  assert.deepStrictEqual((await bobList.json()).documents, []);

  const deniedDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: authorizationHeaders('bob'),
  });
  assert.strictEqual(deniedDownload.status, 404);
  assert.strictEqual((await deniedDownload.json()).error.code, 'DOCUMENT_NOT_FOUND');

  const download = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: authorizationHeaders('alice'),
  });
  assert.strictEqual(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /attachment/);
  assert.strictEqual(await download.text(), 'documento');
});

test('rejeita tokens ausentes, expirados e de emissor incorreto', async () => {
  const missingToken = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(missingToken.status, 401);
  assert.strictEqual((await missingToken.json()).error.code, 'UNAUTHENTICATED');

  const invalidHeaders = [
    authorizationHeaders('alice', { expiresIn: -1 }),
    authorizationHeaders('alice', { issuer: 'https://untrusted.example.test' }),
    authorizationHeaders('alice', { audience: 'another-api' }),
    authorizationHeaders(undefined),
  ];

  for (const headers of invalidHeaders) {
    const response = await fetch(`${baseUrl}/documents`, { headers });
    assert.strictEqual(response.status, 401);
    assert.strictEqual((await response.json()).error.code, 'UNAUTHENTICATED');
  }

  const formData = new FormData();
  formData.append('file', new Blob(['documento']), 'relatorio.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  assert.strictEqual(uploadResponse.status, 401);

  const downloadResponse = await fetch(`${baseUrl}/documents/missing-id/download`);
  assert.strictEqual(downloadResponse.status, 401);
});

test('valida arquivo e limite de tamanho para token autenticado', async () => {
  const headers = authorizationHeaders('alice');

  const noFile = new FormData();
  noFile.append('description', 'sem arquivo');
  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers,
    body: noFile,
  });
  assert.strictEqual(missingFile.status, 400);

  const tooLargeForm = new FormData();
  tooLargeForm.append('file', new Blob(['12345678901']), 'large.txt');
  const tooLarge = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers,
    body: tooLargeForm,
  });
  assert.strictEqual(tooLarge.status, 413);
  assert.strictEqual((await tooLarge.json()).error.code, 'FILE_TOO_LARGE');
});
