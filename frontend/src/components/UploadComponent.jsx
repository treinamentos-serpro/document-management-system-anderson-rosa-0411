import { useRef, useState } from 'react';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadComponent({ onUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  async function submitUpload(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) return;

    const uploaded = await onUpload(selectedFile);
    if (uploaded) {
      setSelectedFile(null);
      inputRef.current.value = '';
    }
  }

  return (
    <form className="upload-panel" onSubmit={submitUpload}>
      <label className="file-picker" htmlFor="document-file">
        <input
          ref={inputRef}
          id="document-file"
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
        <span className="upload-symbol" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 21V5m0 0-6 6m6-6 6 6" />
            <path d="M6 19v7h20v-7" />
          </svg>
        </span>
        <span className="picker-label">Selecionar arquivo</span>
      </label>

      {selectedFile && (
        <div className="selected-file">
          <span className="selected-file-mark" aria-hidden="true">FILE</span>
          <span className="selected-file-details">
            <strong title={selectedFile.name}>{selectedFile.name}</strong>
            <small>{formatFileSize(selectedFile.size)}</small>
          </span>
          <button
            className="remove-file"
            type="button"
            aria-label="Remover arquivo selecionado"
            onClick={() => {
              setSelectedFile(null);
              inputRef.current.value = '';
            }}
          >
            ×
          </button>
        </div>
      )}

      <button className="upload-submit" type="submit" disabled={!selectedFile || isUploading}>
        <span>{isUploading ? 'Enviando...' : 'Enviar documento'}</span>
        {!isUploading && <span aria-hidden="true">↗</span>}
      </button>
    </form>
  );
}