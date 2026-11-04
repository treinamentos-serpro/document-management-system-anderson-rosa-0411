import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentsApi.js';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState('demo-user');
  const [userDraft, setUserDraft] = useState('demo-user');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isCurrentRequest = true;

    setIsLoading(true);
    setErrorMessage('');
    listDocuments(userId)
      .then((result) => {
        if (isCurrentRequest) {
          setDocuments(result);
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setErrorMessage(error.message);
          setDocuments([]);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [userId, refreshVersion]);

  function applyUser(event) {
    event.preventDefault();
    const nextUserId = userDraft.trim();
    if (!nextUserId) {
      setErrorMessage('Informe um identificador de usuário.');
      return;
    }

    setErrorMessage('');
    setNotice('');
    setUserId(nextUserId);
    setRefreshVersion((version) => version + 1);
  }

  async function handleUpload(file) {
    setErrorMessage('');
    setNotice('');
    setIsUploading(true);

    try {
      await uploadDocument(file, userId);
      setNotice(`Arquivo enviado: ${file.name}`);
      setRefreshVersion((version) => version + 1);
      return true;
    } catch (error) {
      setErrorMessage(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  function handleDownloadError(error) {
    setErrorMessage(error.message);
    setNotice('');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M8 4.75h10l6 6v16.5H8V4.75Z" />
              <path d="M18 4.75v6h6M12 17h8M12 21h8" />
              <path d="M5 8.75v19.5h15" />
            </svg>
          </span>
          <span className="brand-name">DMS<span>/</span></span>
          <span className="brand-divider" />
        </a>

        <form className="identity-form" onSubmit={applyUser}>
          <label htmlFor="user-id">ESPAÇO ATIVO</label>
          <input
            id="user-id"
            type="text"
            value={userDraft}
            maxLength={128}
            onChange={(event) => setUserDraft(event.target.value)}
            aria-label="Identificador do usuário"
          />
          <button type="submit" title="Aplicar identificador">
            Aplicar
          </button>
        </form>
      </header>

      <main className="workspace" id="main">
        <div className="page-heading">
          <div>
            <p className="eyebrow"><span /> BIBLIOTECA <b>/</b> ATIVA</p>
            <h1>Documentos</h1>
          </div>
          <div className="workspace-status">
            <span className="status-dot" />
            <span>ESPAÇO</span>
            <strong>{userId}</strong>
          </div>
        </div>

        <div className="content-grid">
          <section className="upload-section" aria-labelledby="upload-heading">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-heading">Adicionar arquivo</h2>
            </div>
            <UploadComponent onUpload={handleUpload} isUploading={isUploading} />
          </section>

          <section className="documents-section" aria-labelledby="documents-heading">
            <div className="section-heading documents-heading">
              <span className="section-index">02</span>
              <h2 id="documents-heading">Biblioteca</h2>
              <span className="document-count" aria-label={`${documents.length} documentos`}>
                {String(documents.length).padStart(2, '0')}
              </span>
            </div>

            {notice && <p className="feedback success" role="status">{notice}</p>}
            {errorMessage && <p className="feedback error" role="alert">{errorMessage}</p>}

            <DocumentList
              documents={documents}
              isLoading={isLoading}
              userId={userId}
              onDownloadError={handleDownloadError}
            />
          </section>
        </div>

        <footer className="page-footer">
          <span>DMS <span className="footer-separator">/</span> GESTÃO DE ARQUIVOS</span>
          <span>DOCUMENTOS</span>
        </footer>
      </main>
    </div>
  );
}
