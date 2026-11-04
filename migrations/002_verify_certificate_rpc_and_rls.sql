-- ==============================================================================
-- MIGRATION: 002_verify_certificate_rpc_and_rls.sql
-- DESCRIZIONE:
-- 1. Abilitazione Row Level Security (RLS) sulle tabelle dei certificati.
-- 2. Creazione della funzione RPC 'verify_certificate_public' con SECURITY DEFINER
--    per consentire la verifica pubblica del codice SENZA concedere privilegi
--    di SELECT sull'intera tabella 'certificates' e SENZA esporre dati personali (PII).
-- 
-- NOTA IMPORTANTE PRIMA DELL'APPLICAZIONE (REVISIONE OBBLIGATORIA):
-- L'abilitazione di RLS bloccherà qualsiasi query diretta eseguita con la chiave
-- anonima (anon key). Se l'attuale dashboard di generazione (/api/certificates)
-- o script batch utilizzano la chiave anonima senza un utente autenticato,
-- l'attivazione di RLS potrebbe interromperne il funzionamento finché non viene
-- configurata la chiave 'service_role' sul backend o apposite policy per utenti loggati.
-- ==============================================================================

-- 1. ABILITAZIONE ROW LEVEL SECURITY SULLE TABELLE
-- Protegge la tabella principale e l'eventuale tabella di backup creata in precedenza.
ALTER TABLE IF EXISTS public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.certificates_backup ENABLE ROW LEVEL SECURITY;

-- 2. REVOCA DEI PRIVILEGI DIRETTI AL RUOLO ANONIMO
-- Nessun utente pubblico o client anonimo deve poter fare SELECT, INSERT, UPDATE, DELETE diretti.
REVOKE ALL ON TABLE public.certificates FROM anon;
REVOKE ALL ON TABLE public.certificates_backup FROM anon;

-- 3. FUNZIONE RPC DEDICATA PER LA VERIFICA PUBBLICA
-- Questa funzione gira con privilegi di sistema (SECURITY DEFINER) ma accetta SOLO
-- un singolo codice ed espone SOLO l'esito e i campi pubblici autorizzati.
-- Non restituisce MAI nome, email, note o altri dati personali.
CREATE OR REPLACE FUNCTION public.verify_certificate_public(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_code text;
    v_record record;
    v_result jsonb;
BEGIN
    -- Sanitizzazione base del codice in input
    v_clean_code := trim(p_code);

    IF v_clean_code IS NULL OR length(v_clean_code) < 3 OR length(v_clean_code) > 100 THEN
        RETURN jsonb_build_object(
            'found', false,
            'message', 'Codice non verificato. Controlla il codice inserito.'
        );
    END IF;

    -- Ricerca esatta del codice: selezione ESPLICITA dei soli dati pubblici
    SELECT certificate_id, status, date, course_type
    INTO v_record
    FROM public.certificates
    WHERE certificate_id = v_clean_code
    LIMIT 1;

    -- Se non trovato
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'found', false,
            'message', 'Codice non verificato. Controlla il codice inserito.'
        );
    END IF;

    -- Se trovato: restituisce solo lo stato e i campi non sensibili
    v_result := jsonb_build_object(
        'found', true,
        'certificate_id', v_record.certificate_id,
        'status', coalesce(v_record.status, 'PASSED'),
        'date', v_record.date,
        'course_type', coalesce(v_record.course_type, 'DIPENDENTI')
    );

    RETURN v_result;
END;
$$;

-- 4. CONCESSIONE DELL'ESECUZIONE DELLA SOLA FUNZIONE RPC AI RUOLI AUTORIZZATI
-- Permette sia ad utenti anonimi che a ruoli server di invocare la funzione di verifica.
GRANT EXECUTE ON FUNCTION public.verify_certificate_public(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_certificate_public(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_certificate_public(text) TO service_role;

COMMENT ON FUNCTION public.verify_certificate_public(text) IS 
'Funzione sicura per la verifica pubblica dei certificati: restituisce unicamente lo stato e i metadati pubblici non sensibili, senza esporre PII.';

