'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';

/**
 * CertificateVerifier - Componente modulare per la verifica dei certificati
 *
 * Può essere:
 * 1. Usato come pagina autonoma (/verifica-certificato)
 * 2. Integrato come sezione/widget all'interno di QUALSIASI pagina esistente
 *
 * Props:
 * - compact (boolean): mostra solo il box di verifica
 * - showFeatures (boolean): mostra i 3 box informativi (default true)
 * - initialCode (string): codice iniziale opzionale
 */
export default function CertificateVerifier({
  compact = false,
  showFeatures = true,
  initialCode = '',
}) {
  const searchParams = useSearchParams();
  const [codice, setCodice] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);

  useEffect(() => {
    const paramCode = searchParams?.get('codice') || searchParams?.get('id');
    if (paramCode && typeof paramCode === 'string') {
      const clean = paramCode.trim().toUpperCase();
      setCodice(clean);
      handleVerify(clean);
    }
  }, [searchParams]);

  const handleVerify = async (codeToVerify) => {
    const targetCode = (typeof codeToVerify === 'string' ? codeToVerify : codice).trim().toUpperCase();
    if (!targetCode) {
      setErrorMessage('Inserisci il codice identificativo presente sul certificato.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setResult(null);
    setResultVisible(false);
    setHasSearched(true);

    try {
      const response = await fetch('/api/certificati/verifica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codice: targetCode }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setErrorMessage(data.message || 'Troppe richieste. Attendi qualche istante e riprova.');
        setIsLoading(false);
        return;
      }

      if (!response.ok && data.status === 'error' && data.outcome !== 'NOT_FOUND') {
        setErrorMessage(data.message || 'Errore durante la verifica.');
        setIsLoading(false);
        return;
      }

      setResult(data);
      setTimeout(() => setResultVisible(true), 50);

      if (data.outcome === 'VALID') {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#ffffff', '#6366f1'],
        });
      }
    } catch {
      setErrorMessage('Impossibile contattare il servizio. Controlla la connessione e riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  const handleReset = () => {
    setCodice('');
    setResult(null);
    setResultVisible(false);
    setErrorMessage('');
    setHasSearched(false);
  };

  return (
    <section className="vc-root">

      {/* ── HEADER ─────────────────────────────── */}
      {!compact && (
        <header className="vc-header">
          <div className="vc-eyebrow">
            <span className="vc-live-dot" />
            Registro ufficiale attestati &mdash; Amministratori di Sistema
          </div>

          <h2 className="vc-title">Verifica certificato</h2>

          <p className="vc-subtitle">
            Inserisci il codice identificativo riportato sull&apos;attestato per confermarne
            l&apos;autenticità e la registrazione ufficiale.
          </p>

          <div className="vc-course-tags">
            <span className="vc-tag blue">
              <i className="vc-tag-dot" />
              NIS2 Dipendenti &mdash; Base
            </span>
            <span className="vc-tag indigo">
              <i className="vc-tag-dot" />
              NIS2 IT / CSIRT / Cyber &mdash; Avanzato
            </span>
          </div>
        </header>
      )}

      {/* ── VERIFICA CARD ──────────────────────── */}
      <div className="vc-card">

        {/* Card header */}
        <div className="vc-card-top">
          <div className="vc-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l7 3v6c0 4.418-3.134 8.556-7 9.9C8.134 19.556 5 15.418 5 11V5l7-3z" />
            </svg>
          </div>
          <div>
            <div className="vc-card-title">Verifica autenticità</div>
            <div className="vc-card-hint">Conforme D.Lgs. 138/2024 · Direttiva (UE) 2022/2555</div>
          </div>
        </div>

        <div className="vc-divider" />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label htmlFor="vc-input" className="vc-label">
            Codice identificativo
          </label>

          <div className="vc-input-wrap">
            <svg className="vc-input-icon" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="vc-input"
              type="text"
              className="vc-input"
              placeholder="Es. 202605-A1B2C3"
              value={codice}
              onChange={(e) => setCodice(e.target.value.toUpperCase())}
              disabled={isLoading}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              required
            />
            {codice && !isLoading && (
              <button type="button" className="vc-clear" onClick={() => setCodice('')} aria-label="Cancella">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="vc-actions">
            <button type="submit" className="vc-btn-primary" disabled={isLoading || !codice.trim()}>
              {isLoading
                ? <><span className="vc-spinner" />Verifica in corso…</>
                : 'Verifica certificato'}
            </button>
            {hasSearched && (
              <button type="button" className="vc-btn-ghost" onClick={handleReset} disabled={isLoading}>
                Nuova ricerca
              </button>
            )}
          </div>
        </form>

        {/* ── RISULTATI ── */}
        <div aria-live="polite">
          {errorMessage && (
            <div className="vc-alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {result && (
            <div className={`vc-result ${resultVisible ? 'show' : ''}`}>

              {/* VALIDO */}
              {result.outcome === 'VALID' && (
                <div className="vc-result-card valid">
                  <div className="vc-result-head">
                    <div className="vc-status-badge valid">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <p className="vc-result-title valid">Certificato valido</p>
                      <p className="vc-result-desc">Documento autentico — registrato nel registro ufficiale</p>
                    </div>
                  </div>

                  <div className="vc-result-table">
                    <div className="vc-row">
                      <span className="vc-row-key">Percorso formativo</span>
                      <span className="vc-row-val blue">{result.certificate?.course}</span>
                    </div>
                    {result.certificate?.issueDate && (
                      <div className="vc-row">
                        <span className="vc-row-key">Data emissione</span>
                        <span className="vc-row-val">{result.certificate.issueDate}</span>
                      </div>
                    )}
                    <div className="vc-row last">
                      <span className="vc-row-key">Codice verificato</span>
                      <code className="vc-code">{result.certificate?.code || codice}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* REVOCATO */}
              {result.outcome === 'REVOKED' && (
                <div className="vc-result-card error">
                  <div className="vc-result-head">
                    <div className="vc-status-badge error">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="vc-result-title error">{result.title || 'Certificato revocato'}</p>
                      <p className="vc-result-desc">{result.message}</p>
                    </div>
                  </div>
                  <code className="vc-code" style={{ marginTop: '12px', display: 'inline-block' }}>
                    {result.certificate?.code || codice}
                  </code>
                </div>
              )}

              {/* SCADUTO */}
              {result.outcome === 'EXPIRED' && (
                <div className="vc-result-card warning">
                  <div className="vc-result-head">
                    <div className="vc-status-badge warning">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" /><path d="M12 7v5l3 3" />
                      </svg>
                    </div>
                    <div>
                      <p className="vc-result-title warning">{result.title || 'Certificato scaduto'}</p>
                      <p className="vc-result-desc">{result.message}</p>
                    </div>
                  </div>
                  <code className="vc-code" style={{ marginTop: '12px', display: 'inline-block' }}>
                    {result.certificate?.code || codice}
                  </code>
                </div>
              )}

              {/* NON VALIDO */}
              {result.outcome === 'INVALID' && (
                <div className="vc-result-card error">
                  <div className="vc-result-head">
                    <div className="vc-status-badge error">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="vc-result-title error">{result.title || 'Certificato non valido'}</p>
                      <p className="vc-result-desc">{result.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* NON TROVATO */}
              {result.outcome === 'NOT_FOUND' && (
                <div className="vc-result-card neutral">
                  <div className="vc-result-head">
                    <div className="vc-status-badge neutral">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                      </svg>
                    </div>
                    <div>
                      <p className="vc-result-title neutral">Nessun risultato</p>
                      <p className="vc-result-desc">
                        Il codice non corrisponde ad alcun attestato nel registro. Controlla maiuscole e trattini (es.&nbsp;202605-A1B2C3).
                      </p>
                    </div>
                  </div>

                  <div className="vc-legacy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, color: '#64748b', marginTop: '1px' }}>
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    <div>
                      <span className="vc-legacy-title">Hai un certificato senza codice (vecchia versione)?</span>
                      <span className="vc-legacy-body">
                        {' '}I certificati precedenti mantengono piena validità. Contattaci per richiedere
                        la nuova versione con codice verificabile online.
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── FEATURE CARDS ─────────────────────── */}
      {!compact && showFeatures && (
        <div className="vc-features">
          <div className="vc-feature">
            <div className="vc-feature-num">01</div>
            <h3 className="vc-feature-title">Attestato di partecipazione</h3>
            <p className="vc-feature-body">
              Valido per il <strong>Corso NIS2 Dipendenti (Base)</strong> e per il{' '}
              <strong>Corso IT / CSIRT / Cyber (Avanzato)</strong>, conformi alla Direttiva (UE) 2022/2555.
            </p>
          </div>

          <div className="vc-feature">
            <div className="vc-feature-num">02</div>
            <h3 className="vc-feature-title">Privacy garantita</h3>
            <p className="vc-feature-body">
              La verifica conferma la validità dell&apos;attestato senza esporre dati personali
              dell&apos;intestatario, nel pieno rispetto del GDPR.
            </p>
          </div>

          <div className="vc-feature">
            <div className="vc-feature-num">03</div>
            <h3 className="vc-feature-title">Certificati senza codice</h3>
            <p className="vc-feature-body">
              Gli attestati emessi in precedenza (privi di codice) mantengono piena validità formale.{' '}
              <strong style={{ color: '#cbd5e1' }}>Contattaci</strong> per richiedere la nuova versione.
            </p>
          </div>
        </div>
      )}

      {/* ── STYLES ────────────────────────────── */}
      <style jsx>{`

        /* Root */
        .vc-root {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          padding: 32px 20px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── Header ── */
        .vc-header {
          text-align: center;
          max-width: 580px;
          margin-bottom: 48px;
        }

        .vc-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #4ade80;
          margin-bottom: 20px;
        }

        .vc-live-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          flex-shrink: 0;
        }

        .vc-title {
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #f8fafc;
          line-height: 1.1;
          margin-bottom: 16px;
        }

        @media (min-width: 768px) {
          .vc-title { font-size: 3.5rem; }
        }

        .vc-subtitle {
          font-size: 1rem;
          color: #64748b;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .vc-course-tags {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .vc-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 6px;
          letter-spacing: 0.01em;
        }

        .vc-tag.blue {
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.18);
          color: #93c5fd;
        }

        .vc-tag.indigo {
          background: rgba(129,140,248,0.08);
          border: 1px solid rgba(129,140,248,0.18);
          color: #c4b5fd;
        }

        .vc-tag-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
          display: inline-block;
          flex-shrink: 0;
        }

        /* ── Main card ── */
        .vc-card {
          width: 100%;
          max-width: 560px;
          background: #0d111c;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 40px;
          box-shadow: 0 20px 48px rgba(0,0,0,0.5);
        }

        .vc-card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .vc-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.18);
          color: #60a5fa;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .vc-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f1f5f9;
          line-height: 1.2;
        }

        .vc-card-hint {
          font-size: 0.72rem;
          color: #334155;
          margin-top: 2px;
          font-weight: 500;
        }

        .vc-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin-bottom: 22px;
        }

        /* ── Form ── */
        .vc-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #475569;
          margin-bottom: 8px;
        }

        .vc-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 14px;
        }

        .vc-input-icon {
          position: absolute;
          left: 14px;
          color: #334155;
          pointer-events: none;
          flex-shrink: 0;
        }

        .vc-input {
          width: 100%;
          background: #060810;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 13px 42px;
          color: #f1f5f9;
          font-size: 0.98rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .vc-input::placeholder {
          color: #1e293b;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
        }

        .vc-input:focus {
          border-color: rgba(59,130,246,0.6);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }

        .vc-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #334155;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .vc-clear:hover { color: #64748b; }

        /* ── Action buttons ── */
        .vc-actions {
          display: flex;
          gap: 10px;
        }

        .vc-btn-primary {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px 20px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
          letter-spacing: 0.01em;
        }

        .vc-btn-primary:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          transform: translateY(-1px);
        }

        .vc-btn-primary:active:not(:disabled) {
          transform: none;
          box-shadow: none;
        }

        .vc-btn-primary:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .vc-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          color: #475569;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 0.87rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.15s, border-color 0.15s;
        }

        .vc-btn-ghost:hover {
          color: #94a3b8;
          border-color: rgba(255,255,255,0.15);
        }

        .vc-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: vc-spin 0.6s linear infinite;
          flex-shrink: 0;
        }

        @keyframes vc-spin {
          to { transform: rotate(360deg); }
        }

        /* ── Alert ── */
        .vc-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          border-radius: 10px;
          padding: 13px 16px;
          margin-top: 18px;
          font-size: 0.86rem;
          line-height: 1.55;
        }

        /* ── Result container ── */
        .vc-result {
          margin-top: 20px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .vc-result.show {
          opacity: 1;
          transform: none;
        }

        /* ── Result cards ── */
        .vc-result-card {
          border-radius: 12px;
          padding: 18px;
        }

        .vc-result-card.valid {
          background: rgba(16,185,129,0.05);
          border: 1px solid rgba(16,185,129,0.2);
        }

        .vc-result-card.error {
          background: rgba(239,68,68,0.05);
          border: 1px solid rgba(239,68,68,0.2);
        }

        .vc-result-card.warning {
          background: rgba(245,158,11,0.05);
          border: 1px solid rgba(245,158,11,0.2);
        }

        .vc-result-card.neutral {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .vc-result-head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .vc-status-badge {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .vc-status-badge.valid  { background: rgba(16,185,129,0.15);  color: #10b981; }
        .vc-status-badge.error  { background: rgba(239,68,68,0.15);   color: #ef4444; }
        .vc-status-badge.warning{ background: rgba(245,158,11,0.15);  color: #f59e0b; }
        .vc-status-badge.neutral{ background: rgba(255,255,255,0.06); color: #64748b; }

        .vc-result-title {
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.25;
          margin: 0 0 4px;
        }

        .vc-result-title.valid   { color: #6ee7b7; }
        .vc-result-title.error   { color: #fca5a5; }
        .vc-result-title.warning { color: #fde68a; }
        .vc-result-title.neutral { color: #e2e8f0; }

        .vc-result-desc {
          font-size: 0.8rem;
          color: #334155;
          line-height: 1.55;
          margin: 0;
        }

        /* Details table */
        .vc-result-table {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          overflow: hidden;
        }

        .vc-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          gap: 12px;
          flex-wrap: wrap;
        }

        .vc-row.last { border-bottom: none; }

        .vc-row-key {
          font-size: 0.7rem;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }

        .vc-row-val {
          font-size: 0.88rem;
          color: #e2e8f0;
          font-weight: 600;
          text-align: right;
        }

        .vc-row-val.blue { color: #60a5fa; }

        .vc-code {
          font-family: 'Courier New', monospace;
          font-size: 0.82rem;
          font-weight: 700;
          color: #93c5fd;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.18);
          padding: 3px 9px;
          border-radius: 5px;
          letter-spacing: 0.05em;
        }

        /* Legacy notice */
        .vc-legacy {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 14px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          text-align: left;
          font-size: 0.82rem;
          line-height: 1.55;
        }

        .vc-legacy-title {
          font-weight: 700;
          color: #94a3b8;
        }

        .vc-legacy-body {
          color: #475569;
        }

        /* ── Feature cards ── */
        .vc-features {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .vc-features { grid-template-columns: repeat(3,1fr); }
        }

        .vc-feature {
          background: #0a0e1a;
          padding: 28px 24px;
          transition: background 0.2s;
        }

        .vc-feature:hover { background: #0d111c; }

        .vc-feature-num {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #3b82f6;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .vc-feature-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 10px;
          line-height: 1.3;
        }

        .vc-feature-body {
          font-size: 0.83rem;
          color: #475569;
          line-height: 1.65;
          margin: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .vc-title { font-size: 2.1rem; }
          .vc-card  { padding: 20px 16px; }
          .vc-row   { flex-direction: column; gap: 4px; }
          .vc-row-val { text-align: left; }
        }
      `}</style>
    </section>
  );
}
