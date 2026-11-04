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
 *    (es. nella pagina dei corsi NIS2, in una modale o in una sezione dedicata).
 *
 * Props:
 * - compact (boolean): se true, mostra solo il box di verifica (ideale per modali o spazi ridotti)
 * - showFeatures (boolean): se true (default), mostra anche i 3 box informativi sottostanti
 * - initialCode (string): codice iniziale facoltativo da verificare
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

  // Lettura query param per QR Code (?codice=... o ?id=...)
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
        setErrorMessage(data.message || 'Troppe richieste in un breve intervallo. Attendi qualche istante prima di riprovare.');
        setIsLoading(false);
        return;
      }

      if (!response.ok && data.status === 'error' && data.outcome !== 'NOT_FOUND') {
        setErrorMessage(data.message || 'Si è verificato un errore durante la verifica.');
        setIsLoading(false);
        return;
      }

      setResult(data);
      setTimeout(() => setResultVisible(true), 40);

      if (data.outcome === 'VALID') {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#ffffff', '#6366f1'],
        });
      }
    } catch (err) {
      setErrorMessage('Impossibile contattare il servizio di verifica. Controlla la connessione di rete e riprova.');
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
    <section className="verifier-wrap">
      {/* 1. HEADER */}
      {!compact && (
        <div className="verifier-header">
          <div className="pill-badge">
            <span className="pill-dot" />
            Conforme D.Lgs. 138/2024 &bull; Direttiva (UE) 2022/2555 (NIS2)
          </div>

          <h2 className="section-title">
            Verifica il tuo certificato
          </h2>

          <p className="section-subtitle">
            Inserisci il codice identificativo riportato sull&apos;attestato per verificarne
            l&apos;autenticità nel registro ufficiale di Amministratori di Sistema.
          </p>

          <div className="course-types">
            <span className="course-pill blue">
              <span className="dot blue" />
              Corso NIS2 Dipendenti (Base)
            </span>
            <span className="course-pill indigo">
              <span className="dot indigo" />
              Corso NIS2 IT / CSIRT / Cyber (Avanzato)
            </span>
          </div>
        </div>
      )}

      {/* 2. CARD VERIFICA */}
      <div className="card-wrap">
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <label htmlFor="cert-input" className="input-label">
              Codice identificativo
            </label>

            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <input
                id="cert-input"
                type="text"
                className="cert-input"
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
                <button
                  type="button"
                  onClick={() => setCodice('')}
                  aria-label="Cancella"
                  className="clear-btn"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="btn-row">
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading || !codice.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Verifica in corso...
                  </>
                ) : 'Verifica'}
              </button>

              {hasSearched && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Nuova verifica
                </button>
              )}
            </div>
          </form>

          {/* ESITI */}
          <div aria-live="polite" style={{ width: '100%' }}>
            {errorMessage && (
              <div className="alert-error">
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {result && (
              <div className={`result-fade ${resultVisible ? 'in' : ''}`}>

                {/* VALIDO */}
                {result.outcome === 'VALID' && (
                  <div className="result-card valid">
                    <div className="result-top">
                      <span className="result-icon valid">✓</span>
                      <div>
                        <div className="result-title valid">Certificato valido</div>
                        <div className="result-sub">Documento autentico registrato nel registro ufficiale</div>
                      </div>
                    </div>
                    <div className="result-details">
                      <div className="detail-row">
                        <span className="detail-key">Percorso formativo</span>
                        <span className="detail-val accent">{result.certificate?.course}</span>
                      </div>
                      {result.certificate?.issueDate && (
                        <div className="detail-row">
                          <span className="detail-key">Data di emissione</span>
                          <span className="detail-val">{result.certificate.issueDate}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-key">Codice verificato</span>
                        <span className="code-badge">{result.certificate?.code || codice}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* REVOCATO */}
                {result.outcome === 'REVOKED' && (
                  <div className="result-card error">
                    <div className="result-top">
                      <span className="result-icon error">✕</span>
                      <div>
                        <div className="result-title error">{result.title || 'Certificato revocato'}</div>
                        <div className="result-sub">{result.message}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#64748b' }}>
                      Codice: <span className="code-badge">{result.certificate?.code || codice}</span>
                    </div>
                  </div>
                )}

                {/* SCADUTO */}
                {result.outcome === 'EXPIRED' && (
                  <div className="result-card warning">
                    <div className="result-top">
                      <span className="result-icon warning">⏱</span>
                      <div>
                        <div className="result-title warning">{result.title || 'Certificato scaduto'}</div>
                        <div className="result-sub">{result.message}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#64748b' }}>
                      Codice: <span className="code-badge">{result.certificate?.code || codice}</span>
                    </div>
                  </div>
                )}

                {/* NON VALIDO */}
                {result.outcome === 'INVALID' && (
                  <div className="result-card error">
                    <div className="result-top">
                      <span className="result-icon error">✕</span>
                      <div>
                        <div className="result-title error">{result.title || 'Certificato non valido'}</div>
                        <div className="result-sub">{result.message}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NON TROVATO */}
                {result.outcome === 'NOT_FOUND' && (
                  <div className="result-card neutral">
                    <div className="result-top">
                      <span className="result-icon neutral">?</span>
                      <div>
                        <div className="result-title neutral">Codice non trovato</div>
                        <div className="result-sub">
                          Nessun attestato corrispondente nel registro. Verifica maiuscole e trattini (es. 202605-A1B2C3).
                        </div>
                      </div>
                    </div>

                    <div className="legacy-box">
                      <span style={{ flexShrink: 0 }}>ℹ️</span>
                      <div>
                        <strong style={{ color: '#e2e8f0', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>
                          Hai un certificato senza codice (vecchia versione)?
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.55 }}>
                          I certificati precedenti mantengono piena validità formale.{' '}
                          <span style={{ color: '#94a3b8' }}>Contattaci per richiedere la nuova versione</span>{' '}
                          con codice verificabile online.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. FEATURE CARDS */}
      {!compact && showFeatures && (
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-num">01</div>
            <h3 className="feature-title">Attestato di partecipazione</h3>
            <p className="feature-desc">
              Valido per il <strong>Corso NIS2 Dipendenti (Base)</strong> e per il{' '}
              <strong>Corso IT / CSIRT / Cyber (Avanzato)</strong>.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-num">02</div>
            <h3 className="feature-title">Privacy garantita (GDPR)</h3>
            <p className="feature-desc">
              La verifica attesta la validità del documento senza esporre
              dati personali dell&apos;intestatario.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-num">03</div>
            <h3 className="feature-title">Certificati senza codice</h3>
            <p className="feature-desc">
              I certificati della vecchia versione restano validi.{' '}
              <strong style={{ color: '#e2e8f0' }}>Contattaci</strong> per richiedere la nuova versione con codice.
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        .verifier-wrap {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 16px;
        }

        /* ---- HEADER ---- */
        .verifier-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 36px;
          max-width: 640px;
        }

        .pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 14px;
          border-radius: 9999px;
          background: rgba(74, 222, 128, 0.07);
          border: 1px solid rgba(74, 222, 128, 0.2);
          color: #4ade80;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          margin-bottom: 20px;
        }

        .pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f1f5f9;
          margin-bottom: 14px;
          line-height: 1.15;
        }

        @media (min-width: 768px) {
          .section-title { font-size: 3rem; }
        }

        .section-subtitle {
          font-size: 1rem;
          color: #64748b;
          line-height: 1.65;
          margin-bottom: 22px;
        }

        .course-types {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .course-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .course-pill.blue {
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #93c5fd;
        }

        .course-pill.indigo {
          background: rgba(129, 140, 248, 0.08);
          border: 1px solid rgba(129, 140, 248, 0.2);
          color: #c4b5fd;
        }

        .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dot.blue { background: #3b82f6; }
        .dot.indigo { background: #818cf8; }

        /* ---- MAIN CARD ---- */
        .card-wrap {
          width: 100%;
          max-width: 580px;
          padding: 1px;
          border-radius: 20px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.03));
          margin-bottom: 40px;
        }

        .card-body {
          background: #0d111c;
          border-radius: 19px;
          padding: 28px 24px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ---- FORM ---- */
        .input-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
          width: 100%;
        }

        .cert-input {
          width: 100%;
          background: #07090f;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 13px 42px 13px 16px;
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }

        .cert-input::placeholder {
          color: #2d3748;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
        }

        .cert-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }

        .clear-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #374151;
          font-size: 0.95rem;
          cursor: pointer;
          padding: 4px 6px;
          transition: color 0.15s;
        }

        .clear-btn:hover { color: #94a3b8; }

        /* ---- BUTTONS ---- */
        .btn-row {
          display: flex;
          gap: 10px;
        }

        .btn-primary {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px 20px;
          font-size: 0.93rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .btn-primary:active:not(:disabled) {
          transform: none;
        }

        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: #64748b;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
          white-space: nowrap;
        }

        .btn-secondary:hover {
          color: #94a3b8;
          border-color: rgba(255,255,255,0.18);
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ---- ALERT ---- */
        .alert-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
          border-radius: 10px;
          padding: 13px 16px;
          margin-top: 16px;
          font-size: 0.87rem;
          line-height: 1.5;
          width: 100%;
          box-sizing: border-box;
        }

        /* ---- RESULT FADE ---- */
        .result-fade {
          margin-top: 18px;
          width: 100%;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.28s ease, transform 0.28s ease;
        }

        .result-fade.in {
          opacity: 1;
          transform: none;
        }

        /* ---- RESULT CARDS ---- */
        .result-card {
          border-radius: 12px;
          padding: 18px;
          text-align: left;
        }

        .result-card.valid {
          background: rgba(16,185,129,0.06);
          border: 1px solid rgba(16,185,129,0.22);
        }

        .result-card.error {
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.22);
        }

        .result-card.warning {
          background: rgba(245,158,11,0.06);
          border: 1px solid rgba(245,158,11,0.22);
        }

        .result-card.neutral {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .result-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }

        .result-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 700;
          flex-shrink: 0;
          line-height: 1;
        }

        .result-icon.valid { background: rgba(16,185,129,0.15); color: #10b981; }
        .result-icon.error { background: rgba(239,68,68,0.15); color: #ef4444; }
        .result-icon.warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .result-icon.neutral { background: rgba(255,255,255,0.05); color: #94a3b8; }

        .result-title {
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.3;
        }

        .result-title.valid { color: #86efac; }
        .result-title.error { color: #fca5a5; }
        .result-title.warning { color: #fde68a; }
        .result-title.neutral { color: #e2e8f0; }

        .result-sub {
          font-size: 0.82rem;
          color: #475569;
          margin-top: 3px;
          line-height: 1.5;
        }

        /* Details table */
        .result-details {
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          overflow: hidden;
        }

        .detail-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .detail-row:last-child { border-bottom: none; }

        .detail-key {
          font-size: 0.65rem;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .detail-val {
          font-size: 0.92rem;
          color: #e2e8f0;
          font-weight: 500;
        }

        .detail-val.accent {
          color: #60a5fa;
          font-weight: 600;
        }

        .code-badge {
          display: inline-block;
          font-family: monospace;
          font-size: 0.85rem;
          font-weight: 700;
          color: #93c5fd;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.2);
          padding: 3px 9px;
          border-radius: 5px;
          letter-spacing: 0.04em;
          width: fit-content;
        }

        /* Legacy notice */
        .legacy-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 12px 14px;
          margin-top: 12px;
          text-align: left;
        }

        /* ---- FEATURES ---- */
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .features-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .feature-card {
          background: #0d111c;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 22px 20px;
          text-align: left;
          transition: border-color 0.2s;
        }

        .feature-card:hover {
          border-color: rgba(255,255,255,0.14);
        }

        .feature-num {
          font-size: 0.7rem;
          font-weight: 700;
          color: #3b82f6;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .feature-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .feature-desc {
          font-size: 0.83rem;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }

        /* ---- RESPONSIVE ---- */
        @media (max-width: 640px) {
          .section-title { font-size: 2rem; }
          .card-body { padding: 22px 18px; }
        }
      `}</style>
    </section>
  );
}
