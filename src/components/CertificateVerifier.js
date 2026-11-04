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
    setHasSearched(true);

    try {
      const response = await fetch('/api/certificati/verifica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    setErrorMessage('');
    setHasSearched(false);
  };

  return (
    <section className="verifier-section-container">
      {/* 1. INTESTAZIONE SEZIONE */}
      {!compact && (
        <div className="verifier-header">
          <div className="pill-badge">
            <span className="pill-dot"></span>
            Conforme D.Lgs. 138/2024 &bull; Direttiva (UE) 2022/2555 (NIS2)
          </div>

          <h2 className="section-title">
            Verifica un certificato
          </h2>

          <p className="section-subtitle">
            Inserisci il codice identificativo riportato sull'attestato per verificarne l’autenticità
            e la registrazione nel registro ufficiale di Amministratori di Sistema.
          </p>

          {/* Badge tipologie corsi verificabili */}
          <div className="course-types-badge">
            <span className="course-type-pill">
              <span className="dot-blue"></span> Corso NIS2 Dipendenti (Base)
            </span>
            <span className="course-type-pill">
              <span className="dot-indigo"></span> Corso NIS2 IT / CSIRT / Cyber (Avanzato)
            </span>
          </div>

          <div className="trust-tags">
            <div className="trust-item">
              <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Direttiva (UE) 2022/2555</span>
            </div>
            <div className="trust-item">
              <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Portale ACN NIS</span>
            </div>
            <div className="trust-item">
              <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Registro Ufficiale Attestati</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. CARD DI VERIFICA (Signature Double-Ring Border del sito) */}
      <div className="card-outer-ring">
        <div className="card-inner">
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <label htmlFor="certificate-code-input" className="form-label">
              Codice identificativo certificato
            </label>

            <div style={{ position: 'relative', marginBottom: '18px' }}>
              <input
                id="certificate-code-input"
                type="text"
                className="vulcan-input"
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
                  aria-label="Cancella codice inserito"
                  className="clear-input-btn"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="btn-actions-group">
              <button
                type="submit"
                className="primary-action-btn"
                disabled={isLoading || !codice.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Verifica in corso...
                  </>
                ) : (
                  'Verifica'
                )}
              </button>

              {hasSearched && (
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Nuova verifica
                </button>
              )}
            </div>
          </form>

          {/* AREA ESITI E RISULTATI */}
          <div aria-live="polite" style={{ width: '100%' }}>
            {errorMessage && (
              <div className="alert-box error">
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
                <div>{errorMessage}</div>
              </div>
            )}

            {result && (
              <div style={{ marginTop: '20px' }}>
                {/* CERTIFICATO VALIDO */}
                {result.outcome === 'VALID' && (
                  <div className="result-card valid">
                    <div className="result-header">
                      <div className="result-icon-badge valid">✓</div>
                      <div>
                        <div className="result-title valid">Certificato valido</div>
                        <div className="result-subtitle valid">
                          Documento autentico e regolarmente registrato nei registri ufficiali di Amministratori di Sistema
                        </div>
                      </div>
                    </div>

                    <div className="result-details-box">
                      <div className="detail-row">
                        <span className="detail-label">Percorso Formativo</span>
                        <span className="detail-value highlight">{result.certificate?.course}</span>
                      </div>
                      {result.certificate?.issueDate && (
                        <div className="detail-row">
                          <span className="detail-label">Data di Emissione</span>
                          <span className="detail-value">{result.certificate.issueDate}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Codice Univoco Verificato</span>
                        <span className="detail-badge-id">{result.certificate?.code || codice}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CERTIFICATO REVOCATO */}
                {result.outcome === 'REVOKED' && (
                  <div className="result-card error">
                    <div className="result-header">
                      <div className="result-icon-badge error">✕</div>
                      <div>
                        <div className="result-title error">{result.title || 'Certificato revocato'}</div>
                        <div className="result-subtitle">{result.message}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '10px' }}>
                      Codice verificato: <span className="detail-badge-id">{result.certificate?.code || codice}</span>
                    </div>
                  </div>
                )}

                {/* CERTIFICATO SCADUTO */}
                {result.outcome === 'EXPIRED' && (
                  <div className="result-card warning">
                    <div className="result-header">
                      <div className="result-icon-badge warning">⏱</div>
                      <div>
                        <div className="result-title warning">{result.title || 'Certificato scaduto'}</div>
                        <div className="result-subtitle">{result.message}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '10px' }}>
                      Codice verificato: <span className="detail-badge-id">{result.certificate?.code || codice}</span>
                    </div>
                  </div>
                )}

                {/* NON VALIDO / NON SUPERATO */}
                {result.outcome === 'INVALID' && (
                  <div className="result-card error">
                    <div className="result-header">
                      <div className="result-icon-badge error">✕</div>
                      <div>
                        <div className="result-title error">{result.title || 'Certificato non valido'}</div>
                        <div className="result-subtitle">{result.message}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NON TROVATO */}
                {result.outcome === 'NOT_FOUND' && (
                  <div className="result-card neutral">
                    <div className="result-header">
                      <div className="result-icon-badge neutral">?</div>
                      <div>
                        <div className="result-title neutral">Codice non verificato. Controlla il codice inserito.</div>
                        <div className="result-subtitle">
                          Nessun attestato corrispondente al codice indicato nel registro ufficiale. Verifica di aver digitato correttamente lettere maiuscole e trattini (es. 202605-A1B2C3).
                        </div>
                      </div>
                    </div>

                    <div className="legacy-notice-box">
                      <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '2px' }}>ℹ️</span>
                      <div>
                        <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px', fontSize: '0.86rem' }}>
                          Certificato della vecchia versione privo di codice?
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                          I certificati rilasciati in precedenza mantengono la loro piena validità formale. 
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}> Si prega di contattarci direttamente per richiedere l'emissione della nuova versione</span> provvista di codice identificativo verificabile online.
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

      {/* 3. SEZIONE INFORMATIVA A 3 CARD (Opzionale / Disattivabile) */}
      {!compact && showFeatures && (
        <div className="features-grid">
          <div className="feature-outer-ring">
            <div className="feature-inner">
              <div className="feature-step-badge">1</div>
              <h3 className="feature-title">Attestato di Partecipazione</h3>
              <p className="feature-desc">
                Documenta la formazione a norma NIS2 sia per il <strong>Corso Dipendenti (Base)</strong> sia per il <strong>Corso IT / CSIRT / Cyber (Avanzato)</strong>.
              </p>
            </div>
          </div>

          <div className="feature-outer-ring">
            <div className="feature-inner">
              <div className="feature-step-badge">2</div>
              <h3 className="feature-title">Tutela della Privacy (GDPR)</h3>
              <p className="feature-desc">
                Nel pieno rispetto della riservatezza, la verifica online attesta la validità
                del documento senza mai esporre dati personali (nome o email) dell'allievo.
              </p>
            </div>
          </div>

          <div className="feature-outer-ring">
            <div className="feature-inner">
              <div className="feature-step-badge">3</div>
              <h3 className="feature-title">Certificati Vecchia Versione</h3>
              <p className="feature-desc">
                I certificati emessi nella vecchia versione (privi di codice identificativo) mantengono piena validità formale. 
                <strong style={{ color: '#ffffff' }}> Si prega di contattarci per richiedere l'emissione della nuova versione</strong> provvista di codice identificativo online.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STILI MODULARI ISOLATI */}
      <style jsx>{`
        .verifier-section-container {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 16px;
        }

        .verifier-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 32px;
        }

        .pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 9999px;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.25);
          color: #4ade80;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          margin-bottom: 18px;
        }

        .pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 8px #4ade80;
        }

        .section-title {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin-bottom: 12px;
          line-height: 1.2;
        }

        @media (min-width: 768px) {
          .section-title {
            font-size: 3rem;
          }
        }

        .section-subtitle {
          font-size: 1.05rem;
          color: #94a3b8;
          max-width: 620px;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .course-types-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .course-type-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.8rem;
          color: #e2e8f0;
          font-weight: 500;
        }

        .dot-blue {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 6px #3b82f6;
        }

        .dot-indigo {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #818cf8;
          box-shadow: 0 0 6px #818cf8;
        }

        .legacy-notice-box {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          text-align: left;
        }

        .trust-tags {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .trust-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #cbd5e1;
          font-weight: 500;
        }

        .trust-icon {
          width: 17px;
          height: 17px;
          color: #3b82f6;
          flex-shrink: 0;
        }

        /* Card Signature Double-Ring */
        .card-outer-ring {
          width: 100%;
          max-width: 620px;
          padding: 6px;
          border-radius: 26px;
          background: linear-gradient(to top, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          margin-bottom: 40px;
        }

        .card-inner {
          background: #0d111c;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 30px 26px;
          text-align: left;
        }

        .form-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .vulcan-input {
          width: 100%;
          background: #07090f;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 14px 18px;
          color: #ffffff;
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .vulcan-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .clear-input-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 6px;
        }

        .clear-input-btn:hover {
          color: #ffffff;
        }

        .btn-actions-group {
          display: flex;
          gap: 12px;
        }

        .primary-action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 13px 24px;
          font-size: 0.96rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
        }

        .primary-action-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .primary-action-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .secondary-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 13px 20px;
          font-size: 0.92rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .secondary-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .alert-box.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          padding: 14px 18px;
          border-radius: 12px;
          margin-top: 18px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .result-card {
          border-radius: 16px;
          padding: 22px;
          text-align: left;
        }

        .result-card.valid {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .result-card.error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .result-card.warning {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .result-card.neutral {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .result-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .result-icon-badge.valid { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .result-icon-badge.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .result-icon-badge.warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .result-icon-badge.neutral { background: rgba(255, 255, 255, 0.06); color: #94a3b8; }

        .result-title {
          font-size: 1.18rem;
          font-weight: 700;
          color: #ffffff;
        }

        .result-title.valid { color: #86efac; }
        .result-title.error { color: #fca5a5; }
        .result-title.warning { color: #fde047; }
        .result-title.neutral { color: #ffffff; }

        .result-subtitle {
          font-size: 0.84rem;
          color: #94a3b8;
          line-height: 1.45;
          margin-top: 3px;
        }

        .result-details-box {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-row {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .detail-label {
          font-size: 0.7rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }

        .detail-value {
          font-size: 0.95rem;
          color: #ffffff;
          font-weight: 500;
        }

        .detail-value.highlight {
          color: #60a5fa;
          font-weight: 600;
        }

        .detail-badge-id {
          display: inline-block;
          font-family: monospace;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          width: fit-content;
        }

        /* Features Grid */
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-outer-ring {
          padding: 4px;
          border-radius: 20px;
          background: linear-gradient(to top, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .feature-inner {
          background: #0d111c;
          border-radius: 16px;
          padding: 24px;
          height: 100%;
          text-align: left;
          display: flex;
          flex-direction: column;
        }

        .feature-step-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #3b82f6;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 14px;
        }

        .feature-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .feature-desc {
          font-size: 0.84rem;
          color: #94a3b8;
          line-height: 1.55;
          margin: 0;
        }

        @media (max-width: 640px) {
          .section-title { font-size: 2rem; }
          .card-inner { padding: 22px 18px; }
        }
      `}</style>
    </section>
  );
}

