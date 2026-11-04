const crypto = require('node:crypto');
const documentRepository = require('../repositories/document.repository');

function toPublicDocument({ storageKey, ...document }) {
  return document;
}

function uploadDocument(file, owner) {
  const document = {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };

  try {
    documentRepository.save(document, file.filename);
  } catch (error) {
    documentRepository.deleteStoredFile(file.filename).catch(() => {});
    throw error;
  }

  return document;
}

function listDocuments(owner) {
  return documentRepository.listByOwner(owner)
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
    .map(toPublicDocument);
}

async function getDocumentDownload(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw Object.assign(new Error('Documento nao encontrado.'), {
      code: 'DOCUMENT_NOT_FOUND',
    });
  }

  try {
    const stream = await documentRepository.openStoredFile(document.storageKey);
    return { document: toPublicDocument(document), stream };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw Object.assign(new Error('Documento nao encontrado.'), {
        code: 'DOCUMENT_NOT_FOUND',
      });
    }
    throw error;
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentDownload,
};