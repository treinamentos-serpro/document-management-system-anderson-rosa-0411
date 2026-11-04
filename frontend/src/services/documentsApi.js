const API_BASE = '/api';

async function createApiError(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const error = new Error(
    payload?.error?.message || `Falha na requisição (${response.status}).`,
  );
  error.status = response.status;
  error.code = payload?.error?.code;
  return error;
}

async function request(path, accessToken, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw await createApiError(response);
  return response;
}

export async function listDocuments(accessToken, { signal } = {}) {
  const response = await request('/documents', accessToken, { signal });
  const result = await response.json();
  return result.documents;
}

export async function uploadDocument(file, accessToken) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', accessToken, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function downloadDocument(documentId, accessToken) {
  const response = await request(
    `/documents/${encodeURIComponent(documentId)}/download`,
    accessToken,
  );
  return response.blob();
}