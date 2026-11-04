import { useState } from 'react';
import { downloadDocument } from '../services/documentsApi.js';

export default function DownloadButton({ documentId, fileName, accessToken, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function download() {
    setIsDownloading(true);
    try {
      const file = await downloadDocument(documentId, accessToken);
      const objectUrl = URL.createObjectURL(file);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      onError(error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      className="download-button"
      type="button"
      onClick={download}
      disabled={isDownloading}
      aria-label={`Baixar ${fileName}`}
      title="Baixar documento"
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 13v3h12v-3" />
      </svg>
      <span>{isDownloading ? 'Baixando' : 'Baixar'}</span>
    </button>
  );
}