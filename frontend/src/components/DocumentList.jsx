import DownloadButton from './DownloadButton.jsx';
import { formatDate, formatFileSize, getFileExtension } from '../formatters.js';

export default function DocumentList({
  documents,
  isLoading,
  isAuthenticated,
  accessToken,
  onDownloadError,
}) {
  if (isLoading) {
    return (
      <div className="list-state loading-state" role="status">
        <span className="loading-line" />
        <span className="loading-line short" />
        <span className="loading-line" />
        <span className="loading-copy">Carregando documentos...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="list-state empty-state">
        <span className="empty-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M7 13h13l4 4h17v19H7V13Z" />
            <path d="M7 19h34" />
          </svg>
        </span>
        <p>Conecte uma sessão para visualizar a biblioteca.</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="list-state empty-state">
        <span className="empty-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M7 13h13l4 4h17v19H7V13Z" />
            <path d="M7 19h34" />
            <path d="M18 27h12" />
          </svg>
        </span>
        <p>Nenhum documento neste espaço.</p>
      </div>
    );
  }

  return (
    <div className="document-list" aria-live="polite">
      {documents.map((document) => (
        <article className="document-row" key={document.id}>
          <span className="file-type" aria-hidden="true">
            {getFileExtension(document.originalName)}
          </span>
          <div className="document-details">
            <h3 title={document.originalName}>{document.originalName}</h3>
            <p>
              <span>{formatFileSize(document.size)}</span>
              <i />
              <time dateTime={document.uploadedAt}>{formatDate(document.uploadedAt)}</time>
            </p>
          </div>
          <DownloadButton
            documentId={document.id}
            fileName={document.originalName}
            accessToken={accessToken}
            onError={onDownloadError}
          />
        </article>
      ))}
    </div>
  );
}