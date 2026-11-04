const crypto = require('node:crypto');
const documentRepository = require('../repositories/document.repository');

function createDocumentMetadata(file, owner) {
  return {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function createDocumentNotFoundError() {
  return Object.assign(new Error('Documento nao encontrado.'), {
    code: 'DOCUMENT_NOT_FOUND',
  });
}

function findOwnedDocument(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw createDocumentNotFoundError();
  }
  return document;
}

function uploadDocument(file, owner) {
  const document = createDocumentMetadata(file, owner);

  try {
    documentRepository.save(document, file.filename);
  } catch (error) {
    documentRepository.deleteStoredFile(file.filename).catch(() => {});
    throw error;
  }

  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentRepository.listByOwner(owner)
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
    .map(toPublicDocument);
}

async function getDocumentDownload(id, owner) {
  const document = findOwnedDocument(id, owner);

  try {
    const stream = await documentRepository.openStoredFile(document.storageKey);
    return { document: toPublicDocument(document), stream };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw createDocumentNotFoundError();
    }
    throw error;
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentDownload,
};