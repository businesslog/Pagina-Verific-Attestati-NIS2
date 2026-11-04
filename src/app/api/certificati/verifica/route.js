import { NextResponse } from 'next/server';
import { verifyCertificateCode, checkRateLimit } from '@/lib/serverCertificateVerifier';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Estrazione dell'indirizzo IP del client considerando header di proxy affidabili.
 * NOTA SICUREZZA:
 * In ambienti cloud (es. Vercel o Cloudflare), 'x-vercel-forwarded-for' o 'cf-connecting-ip'
 * sono generati dalla piattaforma e non falsificabili dal client finale.
 * Gli header 'x-forwarded-for' e 'x-real-ip' possono essere soggetti a spoofing
 * se la richiesta non è filtrata da un reverse proxy verificato.
 */
function getClientIp(req) {
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();

  const cloudflareIp = req.headers.get('cf-connecting-ip');
  if (cloudflareIp) return cloudflareIp.trim();

  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Header di sicurezza e anti-caching per impedire qualsiasi memorizzazione
 * delle risposte di verifica da parte di browser, CDN o proxy intermedi.
 */
function getSecurityHeaders(rateLimitInfo) {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  if (rateLimitInfo) {
    headers['X-RateLimit-Limit'] = String(rateLimitInfo.limit);
    headers['X-RateLimit-Remaining'] = String(rateLimitInfo.remaining);
    if (!rateLimitInfo.allowed) {
      headers['Retry-After'] = String(rateLimitInfo.resetSeconds);
    }
  }

  return headers;
}

/**
 * Metodo POST: unico metodo ammesso per la verifica del certificato.
 * Il codice deve pervenire nel body JSON della richiesta per evitare
 * il tracciamento del codice negli access log o nella cronologia URL.
 */
export async function POST(req) {
  const clientIp = getClientIp(req);
  const rateLimitInfo = checkRateLimit(clientIp);

  if (!rateLimitInfo.allowed) {
    return NextResponse.json(
      {
        outcome: 'RATE_LIMITED',
        status: 'error',
        message: 'Troppe verifiche effettuate in poco tempo. Attendi qualche istante prima di riprovare.',
      },
      {
        status: 429,
        headers: getSecurityHeaders(rateLimitInfo),
      }
    );
  }

  let codice = null;
  try {
    const body = await req.json();
    codice = body?.codice || body?.code;
  } catch {
    return NextResponse.json(
      {
        outcome: 'INVALID_PAYLOAD',
        status: 'error',
        message: 'Richiesta non valida. Formato JSON previsto con campo "codice".',
      },
      {
        status: 400,
        headers: getSecurityHeaders(rateLimitInfo),
      }
    );
  }

  const result = await verifyCertificateCode(codice);

  return NextResponse.json(result.body, {
    status: result.httpStatus,
    headers: getSecurityHeaders(rateLimitInfo),
  });
}

/**
 * Metodo GET: disabilitato per la verifica.
 * Restituisce 405 Method Not Allowed per impedire che i codici certificato
 * viaggino nella URL e rimangano salvati in cronologia o nei log di rete.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Metodo non consentito. La verifica dei certificati è consentita unicamente tramite POST nel corpo della richiesta.',
    },
    {
      status: 405,
      headers: {
        'Allow': 'POST',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    }
  );
}
