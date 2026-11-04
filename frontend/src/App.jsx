import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import TokenForm from './components/TokenForm.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentsApi.js';
import './App.css';

export default function App() {
  const [tokenDraft, setTokenDraft] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [authStatus, setAuthStatus] = useState('disconnected');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let isCurrentRequest = true;
    setIsLoading(true);

    listDocuments(accessToken, { signal: controller.signal })
      .then((result) => {
        if (isCurrentRequest) {
          setDocuments(result);
          setAuthStatus('authenticated');
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (!isCurrentRequest || error.name === 'AbortError') return;

        setDocuments([]);
        setErrorMessage(error.message);
        setAuthStatus(error.status === 401 ? 'invalid' : 'error');
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [accessToken, refreshKey]);

  function connect(event) {
    event.preventDefault();
    const token = tokenDraft.trim();
    if (!token) {
      setErrorMessage('Informe um token para continuar.');
      return;
    }

    setErrorMessage('');
    setNotice('');
    setAuthStatus('checking');
    setAccessToken(token);
    setTokenDraft('');
    setRefreshKey((value) => value + 1);
  }

  function disconnect() {
    setAccessToken('');
    setTokenDraft('');
    setAuthStatus('disconnected');
    setDocuments([]);
    setIsLoading(false);
    setErrorMessage('');
    setNotice('');
  }

  function handleApiError(error) {
    setErrorMessage(error.message);
    setNotice('');
    if (error.status === 401) {
      setAuthStatus('invalid');
      setDocuments([]);
    }
  }

  async function handleUpload(file) {
    setIsUploading(true);
    setErrorMessage('');
    setNotice('');

    try {
      await uploadDocument(file, accessToken);
      setNotice(`Documento enviado: ${file.name}`);
      setRefreshKey((value) => value + 1);
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  const isAuthenticated = authStatus === 'authenticated';

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M8 4.75h10l6 6v16.5H8V4.75Z" />
              <path d="M18 4.75v6h6M12 17h8M12 21h8M5 8.75v19.5h15" />
            </svg>
          </span>
          <span className="brand-name">DMS<span>/</span></span>
          <span className="brand-divider" />
          <span className="brand-caption">arquivo digital</span>
        </a>
        <div className="service-indicator">
          <span className="service-dot" />
          <span>API LOCAL</span>
        </div>
      </header>

      <main className="workspace" id="main">
        <div className="page-heading">
          <div>
            <p className="eyebrow"><span /> ESPAÇO DE TRABALHO <b>/</b> DOCUMENTOS</p>
            <h1>Seus documentos<span>.</span></h1>
          </div>
          <div className={`session-status ${isAuthenticated ? 'is-connected' : ''}`} role="status">
            <span className="session-dot" />
            {authStatus === 'checking' ? 'Validando token' : isAuthenticated ? 'Sessão ativa' : 'Sem sessão'}
          </div>
        </div>

        <TokenForm
          token={tokenDraft}
          status={authStatus}
          onTokenChange={setTokenDraft}
          onSubmit={connect}
          onDisconnect={disconnect}
          disabled={isUploading}
        />

        {errorMessage && <p className="feedback error" role="alert">{errorMessage}</p>}
        {notice && <p className="feedback success" role="status">{notice}</p>}

        <div className="content-grid">
          <section className="upload-section" aria-labelledby="upload-heading">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-heading">Adicionar documento</h2>
            </div>
            <UploadComponent
              onUpload={handleUpload}
              isUploading={isUploading}
              disabled={!isAuthenticated}
            />
            <p className="storage-note"><span aria-hidden="true">L</span> Armazenamento local</p>
          </section>

          <section className="documents-section" aria-labelledby="documents-heading">
            <div className="section-heading">
              <span className="section-index">02</span>
              <h2 id="documents-heading">Biblioteca</h2>
              <span className="document-count" aria-label={`${documents.length} documentos`}>
                {String(documents.length).padStart(2, '0')}
              </span>
            </div>
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              isAuthenticated={isAuthenticated}
              accessToken={accessToken}
              onDownloadError={handleApiError}
            />
          </section>
        </div>

        <footer className="page-footer">
          <span>DMS <b>/</b> GESTÃO DE ARQUIVOS</span>
          <span>METADADOS EM MEMÓRIA</span>
        </footer>
      </main>
    </div>
  );
}
