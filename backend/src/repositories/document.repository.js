const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const storageConfig = require('../config/storage.config');

const { storageDirectory } = storageConfig;
const documentsById = new Map();

function resolveStoragePath(storageKey) {
  if (typeof storageKey !== 'string' || !/^[0-9a-f-]{36}$/i.test(storageKey)) {
    throw new Error('Chave de armazenamento invalida.');
  }

  const filePath = path.resolve(storageDirectory, storageKey);
  if (!filePath.startsWith(`${storageDirectory}${path.sep}`)) {
    throw new Error('Caminho de armazenamento invalido.');
  }
  return filePath;
}

function save(document, storageKey) {
  documentsById.set(document.id, { ...document, storageKey });
}

function listByOwner(owner) {
  return Array.from(documentsById.values())
    .filter((document) => document.owner === owner)
    .map((document) => ({ ...document }));
}

function findById(id) {
  const document = documentsById.get(id);
  return document ? { ...document } : null;
}

async function deleteStoredFile(storageKey) {
  try {
    await fsPromises.unlink(resolveStoragePath(storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function openStoredFile(storageKey) {
  const filePath = resolveStoragePath(storageKey);
  const stats = await fsPromises.stat(filePath);
  if (!stats.isFile()) {
    const error = new Error('Arquivo nao encontrado.');
    error.code = 'ENOENT';
    throw error;
  }
  return fs.createReadStream(filePath);
}

module.exports = {
  storageDirectory,
  save,
  listByOwner,
  findById,
  deleteStoredFile,
  openStoredFile,
};