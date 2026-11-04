import { createClient } from '@supabase/supabase-js';

/**
 * ==============================================================================
 * RATE LIMITER (In-Memory per singola istanza Node.js)
 * ==============================================================================
 * LIMITI ARCHITETTURALI IMPORTANTI:
 * 1. Questo rate limiter risiede nella memoria RAM del singolo processo Node.js.
 * 2. In un ambiente di hosting Serverless o distribuito a più istanze (es. Vercel,
 *    AWS Lambda, cluster Kubernetes, container multipli), la memoria NON è condivisa:
 *    richieste instradate su istanze differenti avranno contatori separati.
 * 3. Pertanto, questo meccanismo fornisce protezione di base per istanze singole,
 *    ma per una distribuzione serverless di produzione DEVE essere affiancato o
 *    sostituito da un rate limiter condiviso (es. Redis via Upstash / Vercel KV)
 *    oppure da regole WAF perimetrali (es. Cloudflare Rate Limiting Rules).
 *
 * AFFIDABILITÀ INDIRIZZO IP (Spoofing):
 * Gli header 'x-forwarded-for' o 'x-real-ip' possono essere falsificati dal client
 * se la richiesta non passa attraverso un reverse-proxy fidato che li sovrascrive.
 * In produzione su Vercel o Cloudflare, utilizzare l'header garantito dalla piattaforma:
 * - Vercel: 'x-vercel-forwarded-for'
 * - Cloudflare: 'cf-connecting-ip'
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Finestra di 60 secondi
const RATE_LIMIT_MAX_REQUESTS = 15; // Massimo 15 richieste al minuto per IP

if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now > data.resetAt) {
        rateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
  if (cleanupTimer.unref) cleanupTimer.unref();
}

export function checkRateLimit(ip) {
  const now = Date.now();
  const clientIp = ip || 'unknown_client';
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    };
  }

  entry.count += 1;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);
  const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      resetSeconds,
    };
  }

  return {
    allowed: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining,
    resetSeconds,
  };
}

/**
 * ==============================================================================
 * CLIENT SUPABASE SERVER-SIDE (Privilegi e Sicurezza)
 * ==============================================================================
 * Utilizza esclusivamente variabili server-side esplicite:
 * - SUPABASE_URL: URL HTTPS dell'istanza
 * - SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY): chiave privata di backend
 *
 * NOTA SUL RISCHIO RESIDUO DELLA CHIAVE SERVICE ROLE:
 * La chiave service-role bypassa tutte le policy RLS su PostgreSQL.
 * Sebbene il nostro codice selezioni solo un singolo record filtrato per codice esatto
 * e solo colonne non sensibili, la chiave in sé possiede privilegi elevati su tutto il DB.
 * Per raggiungere il minimo privilegio, si raccomanda di utilizzare la funzione RPC
 * 'verify_certificate_public' (vedere migration 002) che restringe l'operatività.
 */
function getServerSupabaseClient() {
  // In produzione diamo priorità alle variabili server-side esplicite (SUPABASE_URL e SUPABASE_SECRET_KEY).
  // In sviluppo locale o come fallback per i test, supportiamo anche le variabili già presenti in .env.local.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * ==============================================================================
 * VALIDAZIONE SCHEMA DATABASE TRAMITE ALLOWLIST
 * ==============================================================================
 * Impedisce l'inserimento arbitrario di nomi di tabelle o colonne tramite env var,
 * prevenendo SQL/identifier injection o accessi a tabelle non previste.
 */
const SCHEMA_ALLOWLIST = {
  tables: ['certificates'],
  codeColumns: ['certificate_id'],
  statusColumns: ['status'],
  dateColumns: ['date'],
  courseColumns: ['course_type'],
};

function getValidatedSchema() {
  const table = process.env.CERT_DB_TABLE || 'certificates';
  const codeCol = process.env.CERT_DB_CODE_COLUMN || 'certificate_id';
  const statusCol = process.env.CERT_DB_STATUS_COLUMN || 'status';
  const dateCol = process.env.CERT_DB_DATE_COLUMN || 'date';
  const courseCol = process.env.CERT_DB_COURSE_COLUMN || 'course_type';

  return {
    tableName: SCHEMA_ALLOWLIST.tables.includes(table) ? table : 'certificates',
    codeColumn: SCHEMA_ALLOWLIST.codeColumns.includes(codeCol) ? codeCol : 'certificate_id',
    statusColumn: SCHEMA_ALLOWLIST.statusColumns.includes(statusCol) ? statusCol : 'status',
    dateColumn: SCHEMA_ALLOWLIST.dateColumns.includes(dateCol) ? dateCol : 'date',
    courseColumn: SCHEMA_ALLOWLIST.courseColumns.includes(courseCol) ? courseCol : 'course_type',
  };
}

/**
 * Formattazione sicura della data (YYYY-MM-DD -> DD/MM/YYYY).
 */
function formatDateSafe(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return trimmed;
}

/**
 * Formattazione della tipologia corso autorizzata alla visualizzazione pubblica.
 */
function formatPublicCourseName(courseType) {
  const raw = String(courseType || '').toUpperCase();
  if (raw.includes('CSIRT')) {
    return 'Corso NIS2 IT / CSIRT / Cyber (Avanzato - Direttiva UE 2022/2555)';
  }
  return 'Corso NIS2 Dipendenti (Base - Direttiva UE 2022/2555)';
}

/**
 * Mappatura dello stato secondo lo schema reale del database:
 * NOTA PER IL COLLEGA:
 * Nello schema attuale, 'status' assume tipicamente i valori 'PASSED' (superato)
 * e 'FAILED' (non superato). Eventuali stati di revoca ('REVOKED') o scadenza ('EXPIRED')
 * non sono attualmente gestiti con colonne dedicate.
 */
function mapCertificateStatus(rawStatus) {
  const normalized = String(rawStatus || 'PASSED').trim().toUpperCase();

  if (['REVOKED', 'REVOCATO', 'ANNULLATO', 'SOSPESO'].includes(normalized)) {
    return {
      outcome: 'REVOKED',
      status: 'revoked',
      title: 'Certificato revocato',
      message: 'Il certificato associato a questo codice risulta revocato o non più valido.',
    };
  }

  if (['EXPIRED', 'SCADUTO'].includes(normalized)) {
    return {
      outcome: 'EXPIRED',
      status: 'expired',
      title: 'Certificato scaduto',
      message: 'Il certificato associato a questo codice risulta scaduto.',
    };
  }

  if (['FAILED', 'NON SUPERATO', 'RESPINTO', 'INVALID', 'NON VALIDO'].includes(normalized)) {
    return {
      outcome: 'INVALID',
      status: 'invalid',
      title: 'Certificato non valido',
      message: 'Il certificato associato a questo codice risulta non valido (esito formativo non superato).',
    };
  }

  if (['PASSED', 'VALID', 'VALIDO', 'ATTIVO', 'EMESSO'].includes(normalized)) {
    return {
      outcome: 'VALID',
      status: 'valid',
      title: 'Certificato valido',
      message: 'Certificato valido',
    };
  }

  // Se lo stato è sconosciuto, non inventare una regola: restituire stato neutro
  return {
    outcome: 'UNKNOWN_STATUS',
    status: 'unverified',
    title: 'Stato non verificabile',
    message: `Stato del certificato registrato nel sistema: ${normalized}. Contattare l'ente emittente per maggiori dettagli.`,
  };
}

/**
 * Funzione principale di verifica server-side:
 * 1. Prova prima la RPC PostgreSQL 'verify_certificate_public' (minimo privilegio).
 * 2. Se la RPC non è installata, esegue query diretta circoscritta con Allowlist.
 * 3. Restituisce ESCLUSIVAMENTE dati pubblici autorizzati (NO name, NO email, NO notes).
 */
export async function verifyCertificateCode(rawCode) {
  // Validazione input
  if (!rawCode || typeof rawCode !== 'string') {
    return {
      httpStatus: 400,
      body: {
        outcome: 'INVALID_FORMAT',
        status: 'error',
        message: 'Codice certificato non fornito o non valido.',
      },
    };
  }

  const cleanCode = rawCode.trim();

  // Vincoli di formato del codice
  if (cleanCode.length < 3 || cleanCode.length > 100 || !/^[A-Za-z0-9_\-./]+$/.test(cleanCode)) {
    return {
      httpStatus: 400,
      body: {
        outcome: 'NOT_FOUND',
        status: 'not_found',
        message: 'Codice non verificato. Controlla il codice inserito.',
      },
    };
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    console.error('[CERT_VERIFY] Variabili SUPABASE_URL o SUPABASE_SECRET_KEY mancanti sul server.');
    return {
      httpStatus: 503,
      body: {
        outcome: 'SERVICE_UNAVAILABLE',
        status: 'error',
        message: 'Servizio di verifica momentaneamente non disponibile. Riprova più tardi.',
      },
    };
  }

  try {
    // 1. TENTATIVO CON FUNZIONE RPC (Minimo Privilegio)
    const { data: rpcData, error: rpcError } = await supabase.rpc('verify_certificate_public', {
      p_code: cleanCode,
    });

    if (!rpcError && rpcData) {
      if (!rpcData.found) {
        return {
          httpStatus: 200,
          body: {
            outcome: 'NOT_FOUND',
            status: 'not_found',
            message: 'Codice non verificato. Controlla il codice inserito.',
          },
        };
      }

      const statusInfo = mapCertificateStatus(rpcData.status);
      return {
        httpStatus: 200,
        body: {
          outcome: statusInfo.outcome,
          status: statusInfo.status,
          title: statusInfo.title,
          message: statusInfo.message,
          certificate: {
            code: cleanCode,
            course: formatPublicCourseName(rpcData.course_type),
            issueDate: formatDateSafe(rpcData.date),
          },
        },
      };
    }

    // 2. FALLBACK A QUERY DIRETTA CON ALLOWLIST (se la RPC non è stata ancora eseguita nel DB)
    const schema = getValidatedSchema();
    const selectFields = `${schema.codeColumn}, ${schema.statusColumn}, ${schema.dateColumn}, ${schema.courseColumn}`;

    const { data, error } = await supabase
      .from(schema.tableName)
      .select(selectFields)
      .eq(schema.codeColumn, cleanCode)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[CERT_VERIFY_QUERY_ERROR] Errore esecuzione query');
      return {
        httpStatus: 500,
        body: {
          outcome: 'ERROR',
          status: 'error',
          message: 'Si è verificato un errore durante la verifica. Riprova più tardi.',
        },
      };
    }

    if (!data) {
      return {
        httpStatus: 200,
        body: {
          outcome: 'NOT_FOUND',
          status: 'not_found',
          message: 'Codice non verificato. Controlla il codice inserito.',
        },
      };
    }

    const rawStatus = data[schema.statusColumn];
    const statusInfo = mapCertificateStatus(rawStatus);

    return {
      httpStatus: 200,
      body: {
        outcome: statusInfo.outcome,
        status: statusInfo.status,
        title: statusInfo.title,
        message: statusInfo.message,
        certificate: {
          code: cleanCode,
          course: formatPublicCourseName(data[schema.courseColumn]),
          issueDate: formatDateSafe(data[schema.dateColumn]),
        },
      },
    };
  } catch (err) {
    console.error('[CERT_VERIFY_INTERNAL_ERROR] Errore imprevisto durante la verifica');
    return {
      httpStatus: 500,
      body: {
        outcome: 'ERROR',
        status: 'error',
        message: 'Si è verificato un errore durante la verifica. Riprova più tardi.',
      },
    };
  }
}
