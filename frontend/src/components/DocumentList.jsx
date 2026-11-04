import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName) {
  const extension = fileName.split('.').pop();
  return extension && extension !== fileName ? extension.slice(0, 5).toUpperCase() : 'FILE';
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function DocumentList({ documents, isLoading, userId, onDownloadError }) {
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
            userId={userId}
            onError={onDownloadError}
          />
        </article>
      ))}
    </div>
  );
}