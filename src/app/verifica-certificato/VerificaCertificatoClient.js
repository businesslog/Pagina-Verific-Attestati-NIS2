'use client';

import CertificateVerifier from '@/components/CertificateVerifier';

export default function VerificaCertificatoClient() {
  return (
    <div className="page-wrapper">
      {/* Navbar presente solo nella visualizzazione a pagina intera */}
      <nav className="site-navbar">
        <div className="navbar-container">
          <a href="https://www.amministratoridisistema.it/" className="navbar-brand">
            <img
              src="/logo-bianco-2025.svg"
              alt="Logo BusinessLOG - Amministratori di Sistema"
              width="175"
              height="40"
              style={{ display: 'block', height: '36px', width: 'auto' }}
            />
          </a>

          <div className="navbar-links">
            <a href="https://www.amministratoridisistema.it/corsi-formazione-nis2/" className="nav-link">
              Corsi NIS2
            </a>
            <span className="nav-badge-active">
              Verifica Certificato
            </span>
            <a
              href="https://www.amministratoridisistema.it/"
              className="nav-btn-back"
              target="_blank"
              rel="noopener noreferrer"
            >
              Torna al sito principale &rarr;
            </a>
            <span className="lang-flag" title="Italiano">
              🇮🇹
            </span>
          </div>
        </div>
      </nav>

      {/* Componente modulare di verifica */}
      <div style={{ paddingTop: '20px' }}>
        <CertificateVerifier />
      </div>

      <footer className="page-footer">
        Amministratori di Sistema &bull; BusinessLOG &bull; Portale Ufficiale Convalida Attestati NIS2
      </footer>

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background-color: #07090e;
          background-image: 
            radial-gradient(at 50% 0%, rgba(59, 130, 246, 0.12) 0px, transparent 60%),
            radial-gradient(at 100% 100%, rgba(30, 41, 59, 0.2) 0px, transparent 50%);
          color: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding-bottom: 40px;
        }

        .site-navbar {
          width: 100%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(7, 9, 14, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .navbar-container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.88rem;
        }

        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #ffffff;
        }

        .nav-badge-active {
          color: #ffffff;
          font-weight: 600;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .nav-btn-back {
          color: #ffffff;
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 8px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 0.2s ease;
        }

        .nav-btn-back:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .lang-flag {
          font-size: 1.15rem;
          cursor: default;
        }

        .page-footer {
          margin-top: 30px;
          font-size: 0.78rem;
          color: #64748b;
          text-align: center;
        }

        @media (max-width: 640px) {
          .navbar-links .nav-link,
          .navbar-links .nav-btn-back {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
