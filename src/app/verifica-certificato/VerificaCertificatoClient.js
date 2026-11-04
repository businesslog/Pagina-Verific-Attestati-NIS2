'use client';

import CertificateVerifier from '@/components/CertificateVerifier';

export default function VerificaCertificatoClient() {
  return (
    <div className="page-wrapper">
      <div className="verifier-wrapper">
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
          padding: 40px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .verifier-wrapper {
          width: 100%;
          max-width: 980px;
        }

        .page-footer {
          margin-top: 40px;
          font-size: 0.78rem;
          color: #64748b;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
