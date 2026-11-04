const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const storageConfig = require('../storage.config');
const documentController = require('../controllers/documents.controller');

const router = express.Router();
const requestedFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);
const maxFileSize = Number.isSafeInteger(requestedFileSize) && requestedFileSize > 0
  ? requestedFileSize
  : 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    storageConfig.ensureStorageDirectory()
      .then(() => callback(null, storageConfig.storageDirectory))
      .catch(callback);
  },
  filename: (req, file, callback) => callback(null, crypto.randomUUID()),
});

const upload = multer({
  storage,
  limits: {
    files: 1,
    fields: 0,
    parts: 2,
    fileSize: maxFileSize,
  },
});

router.post(
  '/upload',
  documentController.validateUser,
  upload.single('file'),
  documentController.upload,
);
router.get('/documents', documentController.validateUser, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.validateUser,
  documentController.download,
);

module.exports = router;