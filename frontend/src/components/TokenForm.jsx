export default function TokenForm({
  token,
  status,
  onTokenChange,
  onSubmit,
  onDisconnect,
  disabled,
}) {
  const isAuthenticated = status === 'authenticated';
  const isChecking = status === 'checking';

  if (isAuthenticated) {
    return (
      <section className="token-panel connected-panel" aria-label="Sessão autenticada">
        <span className="token-lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="5" y="10" width="14" height="10" rx="1" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" />
          </svg>
        </span>
        <div className="token-copy">
          <strong>Token verificado</strong>
          <span>JWT em memória</span>
        </div>
        <button className="disconnect-button" type="button" onClick={onDisconnect} disabled={disabled}>
          Desconectar
        </button>
      </section>
    );
  }

  return (
    <form className="token-panel" onSubmit={onSubmit}>
      <div className="token-title">
        <span className="token-lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="5" y="10" width="14" height="10" rx="1" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" />
          </svg>
        </span>
        <label htmlFor="access-token">TOKEN JWT</label>
      </div>
      <input
        id="access-token"
        type="password"
        value={token}
        onChange={(event) => onTokenChange(event.target.value)}
        placeholder="Cole seu token de acesso"
        autoComplete="off"
        spellCheck="false"
        disabled={isChecking || disabled}
        aria-label="Token JWT"
      />
      <button className="connect-button" type="submit" disabled={isChecking || disabled || !token.trim()}>
        {isChecking ? 'Validando...' : status === 'invalid' ? 'Tentar novamente' : 'Conectar'}
        {!isChecking && <span aria-hidden="true">↗</span>}
      </button>
    </form>
  );
}