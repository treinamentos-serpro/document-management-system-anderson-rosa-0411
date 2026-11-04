const fsPromises = require('node:fs/promises');
const path = require('node:path');

const storageDirectory = path.resolve(
  process.env.DMS_STORAGE_DIR || path.join(__dirname, '../storage'),
);

function ensureStorageDirectory() {
  return fsPromises.mkdir(storageDirectory, { recursive: true });
}

module.exports = {
  storageDirectory,
  ensureStorageDirectory,
};