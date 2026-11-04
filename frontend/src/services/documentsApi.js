const API_BASE = '/api';

async function getError(response) {
  try {
    const payload = await response.json();
    return new Error(payload.error?.message || `Falha na requisição (${response.status}).`);
  } catch {
    return new Error(`Falha na requisição (${response.status}).`);
  }
}

async function requestJson(path, userId, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      'X-User-Id': userId,
    },
  });

  if (!response.ok) {
    throw await getError(response);
  }
  return response.json();
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);
  return requestJson('/upload', userId, {
    method: 'POST',
    body: formData,
  });
}

export async function listDocuments(userId) {
  const result = await requestJson('/documents', userId);
  return result.documents;
}

export async function downloadDocument(documentId, userId) {
  const response = await fetch(
    `${API_BASE}/documents/${encodeURIComponent(documentId)}/download`,
    { headers: { 'X-User-Id': userId } },
  );

  if (!response.ok) {
    throw await getError(response);
  }
  return response.blob();
}