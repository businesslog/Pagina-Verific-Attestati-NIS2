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
      // Piccolo delay per animazione fadeIn
      setTimeout(() => setResultVisible(true), 50);

      if (data.outcome === 'VALID') {
        confetti({
          particleCount: 110,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#3b82f6', '#10b981', '#ffffff', '#6366f1', '#a78bfa'],
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
    <section className="verifier-section-container">
      {/* 1. INTESTAZIONE SEZIONE */}
      {!compact && (
        <div className="verifier-header">
          {/* Pill badge superiore */}
          <div className="pill-badge">
            <span className="pill-dot" />
            Conforme D.Lgs. 138/2024 &bull; Direttiva (UE) 2022/2555 (NIS2)
          </div>

          {/* Monospace label stile "registro" */}
          <div className="registry-label">
            — Registro Ufficiale Attestati 2025 —
          </div>

          <h2 className="section-title">
            Verifica un <span className="title-accent">certificato</span>
          </h2>

          <p className="section-subtitle">
            Inserisci il codice identificativo riportato sull&apos;attestato per verificarne l&apos;autenticità
            e la registrazione nel registro ufficiale di Amministratori di Sistema.
          </p>

          {/* Badge tipologie corsi verificabili */}
          <div className="course-types-badge">
            <span className="course-type-pill blue">
              <span className="dot-blue" />
              Corso NIS2 Dipendenti (Base)
            </span>
            <span className="course-type-pill indigo">
              <span className="dot-indigo" />
              Corso NIS2 IT / CSIRT / Cyber (Avanzato)
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

      {/* 2. CARD DI VERIFICA (Signature Double-Ring Border) */}
      <div className="card-outer-ring">
        {/* Glow decorativo dietro la card */}
        <div className="card-glow" aria-hidden="true" />

        <div className="card-inner">
          {/* Icona scudo in cima */}
          <div className="card-shield-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 2l7 3v6c0 4.418-3.134 8.556-7 9.9C8.134 19.556 5 15.418 5 11V5l7-3z" />
            </svg>
          </div>

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
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '7px', flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 2l7 3v6c0 4.418-3.134 8.556-7 9.9C8.134 19.556 5 15.418 5 11V5l7-3z" />
                    </svg>
                    Verifica Certificato
                  </>
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
              <div className={`result-wrapper ${resultVisible ? 'visible' : ''}`}>
                {/* CERTIFICATO VALIDO */}
                {result.outcome === 'VALID' && (
                  <div className="result-card valid">
                    <div className="result-header">
                      <div className="result-icon-badge valid">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="result-title valid">Certificato valido</div>
                        <div className="result-subtitle valid">
                          Documento autentico — registrato nel registro ufficiale di Amministratori di Sistema
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
                      <div className="result-icon-badge error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
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
                      <div className="result-icon-badge warning">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                          <circle cx="12" cy="12" r="10" />
                          <path strokeLinecap="round" d="M12 7v5l3 3" />
                        </svg>
                      </div>
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
                      <div className="result-icon-badge error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
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
                      <div className="result-icon-badge neutral">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                          <circle cx="12" cy="12" r="10" />
                          <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                        </svg>
                      </div>
                      <div>
                        <div className="result-title neutral">Codice non trovato</div>
                        <div className="result-subtitle">
                          Nessun attestato corrispondente nel registro ufficiale. Verifica maiuscole e trattini (es. 202605-A1B2C3).
                        </div>
                      </div>
                    </div>

                    <div className="legacy-notice-box">
                      <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>ℹ️</span>
                      <div>
                        <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px', fontSize: '0.86rem' }}>
                          Certificato della vecchia versione privo di codice?
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                          I certificati rilasciati in precedenza mantengono la loro piena validità formale.{' '}
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Si prega di contattarci direttamente per richiedere l&apos;emissione della nuova versione</span>{' '}
                          provvista di codice identificativo verificabile online.
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

      {/* 3. SEZIONE INFORMATIVA A 3 CARD */}
      {!compact && showFeatures && (
        <div className="features-grid">
          <div className="feature-outer-ring">
            <div className="feature-inner">
              <div className="feature-icon-wrap blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="feature-title">Attestato di Partecipazione</h3>
              <p className="feature-desc">
                Documenta la formazione a norma NIS2 sia per il <strong>Corso Dipendenti (Base)</strong> sia per il <strong>Corso IT / CSIRT / Cyber (Avanzato)</strong>.
              </p>
            </div>
          </div>

          <div className="feature-outer-ring">
            <div className="feature-inner">
              <div className="feature-icon-wrap indigo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="feature-title">Tutela della Privacy (GDPR)</h3>
              <p className="feature-desc">
                Nel pieno rispetto della riservatezza, la verifica online attesta la validità
                del documento senza mai esporre dati personali (nome o email) dell&apos;allievo.
              </p>
            </div>
          </div>

          <div className="feature-outer-ring">
            <div className="feature-inner">
              <div className="feature-icon-wrap green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="feature-title">Certificati Vecchia Versione</h3>
              <p className="feature-desc">
                I certificati emessi nella vecchia versione (privi di codice) mantengono piena validità formale.{' '}
                <strong style={{ color: '#ffffff' }}>Contattaci per richiedere la nuova versione</strong> con codice verificabile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STILI MODULARI ISOLATI */}
      <style jsx>{`
        /* =============================================
           CONTAINER & LAYOUT
        ============================================= */
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

        /* =============================================
           HEADER
        ============================================= */
        .verifier-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 36px;
        }

        /* Live status pill */
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
          margin-bottom: 14px;
        }

        .pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 8px #4ade80;
          animation: pulseGreen 2.2s ease-in-out infinite;
        }

        @keyframes pulseGreen {
          0%, 100% { box-shadow: 0 0 6px #4ade80; opacity: 1; }
          50% { box-shadow: 0 0 14px #4ade80; opacity: 0.75; }
        }

        /* Monospace registry label */
        .registry-label {
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.72rem;
          letter-spacing: 0.15em;
          color: #475569;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        /* Title */
        .section-title {
          font-size: 2.4rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #ffffff;
          margin-bottom: 14px;
          line-height: 1.15;
        }

        .title-accent {
          background: linear-gradient(135deg, #3b82f6 0%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @media (min-width: 768px) {
          .section-title {
            font-size: 3.2rem;
          }
        }

        .section-subtitle {
          font-size: 1.05rem;
          color: #94a3b8;
          max-width: 580px;
          line-height: 1.65;
          margin-bottom: 20px;
        }

        /* Course type pills */
        .course-types-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .course-type-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .course-type-pill:hover {
          transform: translateY(-1px);
        }

        .course-type-pill.blue {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #93c5fd;
        }

        .course-type-pill.indigo {
          background: rgba(129, 140, 248, 0.1);
          border: 1px solid rgba(129, 140, 248, 0.3);
          color: #c4b5fd;
        }

        .dot-blue {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 8px #3b82f6;
          flex-shrink: 0;
        }

        .dot-indigo {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #818cf8;
          box-shadow: 0 0 8px #818cf8;
          flex-shrink: 0;
        }

        /* Trust tags */
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
          font-size: 0.84rem;
          color: #64748b;
          font-weight: 500;
          transition: color 0.2s;
        }

        .trust-item:hover {
          color: #94a3b8;
        }

        .trust-icon {
          width: 16px;
          height: 16px;
          color: #3b82f6;
          flex-shrink: 0;
        }

        /* =============================================
           MAIN CARD (DOUBLE-RING)
        ============================================= */
        .card-outer-ring {
          position: relative;
          width: 100%;
          max-width: 620px;
          padding: 2px;
          border-radius: 26px;
          background: linear-gradient(145deg,
            rgba(59, 130, 246, 0.35) 0%,
            rgba(255, 255, 255, 0.08) 40%,
            rgba(129, 140, 248, 0.2) 100%
          );
          box-shadow:
            0 25px 60px -12px rgba(0, 0, 0, 0.7),
            0 0 0 1px rgba(255, 255, 255, 0.04);
          margin-bottom: 44px;
        }

        /* Soft ambient glow */
        .card-glow {
          position: absolute;
          inset: -30px;
          border-radius: 50px;
          background: radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          pointer-events: none;
          z-index: -1;
        }

        .card-inner {
          background: #0d111c;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 32px 28px 28px;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0;
        }

        /* Shield icon in card header */
        .card-shield-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          margin-bottom: 20px;
        }

        /* =============================================
           FORM ELEMENTS
        ============================================= */
        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          width: 100%;
        }

        .vulcan-input {
          width: 100%;
          background: rgba(7, 9, 15, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 15px 44px 15px 18px;
          color: #ffffff;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
        }

        .vulcan-input::placeholder {
          color: #334155;
          font-weight: 400;
          letter-spacing: 0.03em;
          text-transform: none;
        }

        .vulcan-input:focus {
          border-color: #3b82f6;
          box-shadow:
            inset 0 2px 6px rgba(0, 0, 0, 0.4),
            0 0 0 3px rgba(59, 130, 246, 0.18);
        }

        .clear-input-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #475569;
          font-size: 1rem;
          cursor: pointer;
          padding: 6px;
          line-height: 1;
          transition: color 0.15s ease;
        }

        .clear-input-btn:hover {
          color: #94a3b8;
        }

        /* =============================================
           BUTTONS
        ============================================= */
        .btn-actions-group {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .primary-action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 14px 24px;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow:
            0 4px 16px rgba(59, 130, 246, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .primary-action-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow:
            0 8px 24px rgba(59, 130, 246, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .primary-action-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .primary-action-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .secondary-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .secondary-action-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          border-color: rgba(255, 255, 255, 0.18);
        }

        .btn-spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
          margin-right: 8px;
          flex-shrink: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* =============================================
           ALERT BOX
        ============================================= */
        .alert-box.error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 14px 18px;
          border-radius: 12px;
          margin-top: 20px;
          font-size: 0.88rem;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }

        /* =============================================
           RESULT CARDS
        ============================================= */
        .result-wrapper {
          margin-top: 22px;
          width: 100%;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }

        .result-wrapper.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .result-card {
          border-radius: 16px;
          padding: 20px;
          text-align: left;
        }

        .result-card.valid {
          background: rgba(16, 185, 129, 0.07);
          border: 1px solid rgba(16, 185, 129, 0.28);
          box-shadow: 0 0 24px rgba(16, 185, 129, 0.08), inset 0 0 20px rgba(16, 185, 129, 0.03);
        }

        .result-card.error {
          background: rgba(239, 68, 68, 0.07);
          border: 1px solid rgba(239, 68, 68, 0.28);
        }

        .result-card.warning {
          background: rgba(245, 158, 11, 0.07);
          border: 1px solid rgba(245, 158, 11, 0.28);
        }

        .result-card.neutral {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        .result-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 16px;
        }

        .result-icon-badge {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .result-icon-badge.valid {
          background: rgba(16, 185, 129, 0.18);
          color: #10b981;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.3);
        }

        .result-icon-badge.error {
          background: rgba(239, 68, 68, 0.18);
          color: #ef4444;
        }

        .result-icon-badge.warning {
          background: rgba(245, 158, 11, 0.18);
          color: #f59e0b;
        }

        .result-icon-badge.neutral {
          background: rgba(255, 255, 255, 0.07);
          color: #94a3b8;
        }

        .result-title {
          font-size: 1.08rem;
          font-weight: 700;
          line-height: 1.3;
        }

        .result-title.valid { color: #6ee7b7; }
        .result-title.error { color: #fca5a5; }
        .result-title.warning { color: #fde68a; }
        .result-title.neutral { color: #e2e8f0; }

        .result-subtitle {
          font-size: 0.83rem;
          color: #64748b;
          line-height: 1.5;
          margin-top: 4px;
        }

        .result-subtitle.valid {
          color: rgba(110, 231, 183, 0.6);
        }

        /* Details box inside VALID card */
        .result-details-box {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .detail-row {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .detail-row:first-child {
          padding-top: 0;
        }

        .detail-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .detail-label {
          font-size: 0.68rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .detail-value {
          font-size: 0.95rem;
          color: #e2e8f0;
          font-weight: 500;
        }

        .detail-value.highlight {
          color: #60a5fa;
          font-weight: 700;
        }

        .detail-badge-id {
          display: inline-block;
          font-family: 'Courier New', monospace;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.28);
          color: #93c5fd;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          width: fit-content;
        }

        /* Legacy notice inside NOT_FOUND */
        .legacy-notice-box {
          margin-top: 14px;
          padding: 13px 15px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          text-align: left;
        }

        /* =============================================
           FEATURES GRID
        ============================================= */
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-outer-ring {
          padding: 2px;
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.015));
          border: 1px solid rgba(255, 255, 255, 0.07);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .feature-outer-ring:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
        }

        .feature-inner {
          background: #0d111c;
          border-radius: 18px;
          padding: 24px 22px;
          height: 100%;
          text-align: left;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        /* Icon wrap for feature cards */
        .feature-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          flex-shrink: 0;
        }

        .feature-icon-wrap.blue {
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .feature-icon-wrap.indigo {
          background: rgba(129, 140, 248, 0.12);
          border: 1px solid rgba(129, 140, 248, 0.2);
          color: #a5b4fc;
        }

        .feature-icon-wrap.green {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .feature-title {
          font-size: 1rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .feature-desc {
          font-size: 0.84rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
          flex: 1;
        }

        /* =============================================
           RESPONSIVE
        ============================================= */
        @media (max-width: 640px) {
          .section-title { font-size: 2.1rem; }
          .card-inner { padding: 24px 18px 20px; }
          .primary-action-btn { font-size: 0.9rem; }
          .trust-tags { gap: 12px; }
        }
      `}</style>
    </section>
  );
}
