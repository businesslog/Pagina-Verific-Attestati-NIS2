# Guida di Integrazione: Verifica Certificati (amministratoridisistema.it)

Questo pacchetto contiene tutto il necessario per aggiungere la pagina pubblica di verifica certificati al sito aziendale Next.js **amministratoridisistema.it**.

L'utente potrà raggiungere il servizio direttamente all'indirizzo:
- `https://amministratoridisistema.it/verifica-certificato`
- oppure (se si desidera un sottodominio dedicato) `https://verifica.amministratoridisistema.it` tramite opportuno routing o redirect DNS.

---

## 📦 Struttura dei file inclusi

```text
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── certificati/
│   │   │       └── verifica/
│   │   │           └── route.js                 <-- Endpoint server-side (POST)
│   │   └── verifica-certificato/
│   │       ├── page.js                          <-- Server component con Metadata SEO
│   │       └── VerificaCertificatoClient.js     <-- Interfaccia responsive utente
│   └── lib/
│       └── serverCertificateVerifier.js         <-- Logica di verifica, allowlist e rate limit
├── migrations/
│   └── 002_verify_certificate_rpc_and_rls.sql   <-- Script SQL (RPC Supabase e RLS)
├── .env.example                                 <-- Esempio variabili d'ambiente server-side
└── ISTRUZIONI_INTEGRAZIONE.md                   <-- Questa guida
```

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

