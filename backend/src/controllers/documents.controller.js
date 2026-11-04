const documentService = require('../services/documents.service');

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Envie um arquivo no campo "file".',
      },
    });
  }

  const document = documentService.uploadDocument(req.file, req.auth.userId);
  return res.status(201).json(document);
}

function list(req, res) {
  return res.status(200).json({
    documents: documentService.listDocuments(req.auth.userId),
  });
}

async function download(req, res, next) {
  const { document, stream } = await documentService.getDocumentDownload(
    req.params.id,
    req.auth.userId,
  );

  stream.on('error', next);
  res.attachment(document.originalName);
  res.type('application/octet-stream');
  return stream.pipe(res);
}

module.exports = {
  upload,
  list,
  download,
};