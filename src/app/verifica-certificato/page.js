import { Suspense } from 'react';
import VerificaCertificatoClient from './VerificaCertificatoClient';

export const metadata = {
  title: 'Verifica un certificato | Amministratori di Sistema',
  description: "Portale ufficiale per la verifica dell'autenticità dei certificati e attestati di formazione emessi da Amministratori di Sistema.",
};

export default function VerificaCertificatoPage() {
  return (
    <Suspense
      fallback={
        <div
          className="container"
          style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          Caricamento servizio di verifica...
        </div>
      }
    >
      <VerificaCertificatoClient />
    </Suspense>
  );
}

