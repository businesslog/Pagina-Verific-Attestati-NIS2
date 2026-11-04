# Guida di Integrazione: Modulo Verifica Certificati (amministratoridisistema.it)

Questo pacchetto contiene il modulo completo per la verifica pubblica degli attestati di formazione.
È progettato per essere utilizzato in **due modalità flessibili**:

1. **Come pagina autonoma dedicata**: all'indirizzo `/verifica-certificato` (o sul sottodominio `verifica.amministratoridisistema.it`).
2. **Come componente/sezione integrabile**: all'interno di **qualsiasi pagina già esistente** del sito (ad esempio direttamente nella landing page dei corsi NIS2, in una sezione dedicata o dentro una modale).

---

## 📦 Struttura dei file

```text
├── src/
│   ├── components/
│   │   └── CertificateVerifier.js           <-- COMPONENTE MODULARE RIUTILIZZABILE
│   ├── app/
│   │   ├── api/
│   │   │   └── certificati/
│   │   │       └── verifica/
│   │   │           └── route.js             <-- Endpoint server-side (POST, no-cache)
│   │   └── verifica-certificato/
│   │       ├── page.js                      <-- Route page con metadati SEO
│   │       └── VerificaCertificatoClient.js <-- Wrapper con navbar per visualizzazione a pagina intera
│   └── lib/
│       └── serverCertificateVerifier.js     <-- Logica server, allowlist e rate limit
├── public/
│   └── logo-bianco-2025.svg                 <-- Logo ufficiale BusinessLOG / Enterprise
├── migrations/
│   └── 002_verify_certificate_rpc_and_rls.sql <-- Script SQL per Supabase (RPC + RLS)
└── .env.example                             <-- Template variabili server-side
```

---

## 💡 Come usarlo nel sito: le 2 Modalità

### Modalità 1: Inserirlo dentro una pagina esistente (Componente/Sezione)
Se vuoi integrarlo all'interno di una pagina che ha già la propria navbar e il proprio footer (es. la pagina corsi NIS2):

```jsx
import CertificateVerifier from '@/components/CertificateVerifier';

export default function MiaPaginaCorsi() {
  return (
    <div>
      {/* Tuoi contenuti esistenti ... */}

      {/* Sezione di verifica certificati */}
      <CertificateVerifier />

      {/* Oppure versione compatta per modali o spazi ridotti: */}
      {/* <CertificateVerifier compact={true} /> */}
    </div>
  );
}
```

### Modalità 2: Pagina autonoma `/verifica-certificato`
Basta copiare la cartella `src/app/verifica-certificato/`: Next.js creerà automaticamente la rotta `https://amministratoridisistema.it/verifica-certificato`.

---

## 🚀 Passaggi di installazione nel sito aziendale

### 1. Copia dei file
Copia le cartelle e i file di questo archivio direttamente all'interno del progetto Next.js del sito aziendale, rispettando la medesima struttura di cartelle (`src/app/...` e `src/lib/...`).

### 2. Configurazione Variabili d'Ambiente
Nelle impostazioni di hosting (es. Vercel, server aziendale) o nel file `.env.local`, configurare le seguenti variabili server-side (**senza** prefisso `NEXT_PUBLIC_`):

```env
# URL dell'istanza Supabase aziendale
SUPABASE_URL=https://tuo-progetto.supabase.co

# Chiave segreta server-side (Service Role / Secret key)
SUPABASE_SECRET_KEY=la_tua_chiave_segreta_qui
```

> ⚠️ **Sicurezza**: Non esporre mai `SUPABASE_SECRET_KEY` nel client o con `NEXT_PUBLIC_`. La chiave viene letta unicamente dagli endpoint server-side.

### 3. Database & RLS (Supabase)
All'interno della cartella `migrations/` è presente il file:
`migrations/002_verify_certificate_rpc_and_rls.sql`

Questo script:
1. Abilita la Row Level Security (RLS) sulla tabella `certificates`.
2. Blocca accessi pubblici non autorizzati (`REVOKE ALL FROM anon`).
3. Crea la funzione PostgreSQL `verify_certificate_public(p_code text)` con `SECURITY DEFINER` per consentire la verifica del singolo codice senza esporre dati personali (PII).

*Nota*: Se l'attuale gestionale di emissione certificati usa già un utente autenticato o la chiave di backend `service_role`, la migrazione può essere applicata direttamente. Se usa la chiave anonima, verificare prima le policy per gli utenti loggati.

---

## 🔒 Specifiche di Sicurezza e Privacy

1. **Nessun dato personale esposto**: L'endpoint non seleziona né restituisce mai `name`, `email` o `notes`. Vengono mostrati pubblicamente solo il titolo del corso, la data di emissione e il codice univoco.
2. **Accetta solo richieste POST**: I codici certificato viaggiano nel corpo della richiesta JSON, evitando che rimangano salvati nei log degli URL o nella cronologia del browser. Chiamate GET rispondono con `405 Method Not Allowed`.
3. **No-Cache**: Le risposte sono protette da `Cache-Control: no-store, no-cache, max-age=0`.
4. **Protezione anti-enumerazione**: È attivo un rate limiter server-side (15 richieste/minuto per IP). Per distribuzioni serverless ad alto traffico è consigliabile affiancare regole WAF (es. Cloudflare Rate Limiting).
5. **Certificati storici**: La pagina include una sezione dedicata che spiega che gli attestati emessi in precedenza senza codice identificativo mantengono la loro piena validità formale e non sono da considerarsi non autentici.

