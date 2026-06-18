-- =============================================================================
-- FanIQ — PostgreSQL: Indici Composti + Row-Level Security
-- =============================================================================
-- Questo script è eseguito automaticamente dallo startup FastAPI quando
-- FANIQ_DATABASE_URL punta a PostgreSQL.
-- Puoi eseguirlo manualmente su Neon dalla SQL console per verificare o
-- per il setup avanzato con ruolo dedicato (sezione in fondo).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SEZIONE 1: INDICI COMPOSTI
-- Ogni indice inizia con club_id (cardinalità più alta = filtra subito
-- tutti i record degli altri club). La seconda colonna è quella usata
-- nel WHERE o ORDER BY della query specifica.
-- -----------------------------------------------------------------------------

-- fans: ricerca email dentro un club (_find_or_create_fan)
CREATE INDEX IF NOT EXISTS ix_fans_club_email
    ON fans (club_id, email);

-- fans: scan completo per club (compute_fan_segments, dashboard_stats)
CREATE INDEX IF NOT EXISTS ix_fans_club_id
    ON fans (club_id);

-- abbonamenti: retention per stagione (dashboard_retention)
CREATE INDEX IF NOT EXISTS ix_abbonamenti_club_stagione
    ON abbonamenti (club_id, stagione);

-- abbonamenti: join fan→abbonamenti dentro un club
CREATE INDEX IF NOT EXISTS ix_abbonamenti_club_fan
    ON abbonamenti (club_id, fan_id);

-- biglietti: presenze per partita (dashboard_presenze)
CREATE INDEX IF NOT EXISTS ix_biglietti_club_data
    ON biglietti (club_id, data_partita);

-- biglietti: join fan→biglietti dentro un club
CREATE INDEX IF NOT EXISTS ix_biglietti_club_fan
    ON biglietti (club_id, fan_id);

-- shop_orders: revenue per periodo (dashboard_revenue_breakdown)
CREATE INDEX IF NOT EXISTS ix_shop_club_data
    ON shop_orders (club_id, data);

-- shop_orders: join fan→shop dentro un club
CREATE INDEX IF NOT EXISTS ix_shop_club_fan
    ON shop_orders (club_id, fan_id);

-- upload_history: lista upload per club (upload/history endpoint)
CREATE INDEX IF NOT EXISTS ix_upload_history_club_ts
    ON upload_history (club_id, uploaded_at DESC);

-- privacy_log: log audit GDPR per club (privacy/log endpoint)
CREATE INDEX IF NOT EXISTS ix_privacy_log_club_ts
    ON privacy_log (club_id, created_at DESC);


-- -----------------------------------------------------------------------------
-- SEZIONE 2: ROW-LEVEL SECURITY (RLS) — setup base
-- Applicato automaticamente dallo startup FastAPI su ogni tabella tenant.
-- La variabile app.current_club_id viene impostata in tenant.py con
-- SET LOCAL prima di ogni query autenticata.
-- -----------------------------------------------------------------------------

ALTER TABLE fans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE abbonamenti    ENABLE ROW LEVEL SECURITY;
ALTER TABLE biglietti      ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_log    ENABLE ROW LEVEL SECURITY;

-- Policy idempotente: DROP + CREATE
DROP POLICY IF EXISTS tenant_isolation ON fans;
DROP POLICY IF EXISTS tenant_isolation ON abbonamenti;
DROP POLICY IF EXISTS tenant_isolation ON biglietti;
DROP POLICY IF EXISTS tenant_isolation ON shop_orders;
DROP POLICY IF EXISTS tenant_isolation ON upload_history;
DROP POLICY IF EXISTS tenant_isolation ON privacy_log;

CREATE POLICY tenant_isolation ON fans
    AS PERMISSIVE FOR ALL TO PUBLIC
    USING (club_id = NULLIF(current_setting('app.current_club_id', true), '')::integer);

CREATE POLICY tenant_isolation ON abbonamenti
    AS PERMISSIVE FOR ALL TO PUBLIC
    USING (club_id = NULLIF(current_setting('app.current_club_id', true), '')::integer);

CREATE POLICY tenant_isolation ON biglietti
    AS PERMISSIVE FOR ALL TO PUBLIC
    USING (club_id = NULLIF(current_setting('app.current_club_id', true), '')::integer);

CREATE POLICY tenant_isolation ON shop_orders
    AS PERMISSIVE FOR ALL TO PUBLIC
    USING (club_id = NULLIF(current_setting('app.current_club_id', true), '')::integer);

CREATE POLICY tenant_isolation ON upload_history
    AS PERMISSIVE FOR ALL TO PUBLIC
    USING (club_id = NULLIF(current_setting('app.current_club_id', true), '')::integer);

CREATE POLICY tenant_isolation ON privacy_log
    AS PERMISSIVE FOR ALL TO PUBLIC
    USING (club_id = NULLIF(current_setting('app.current_club_id', true), '')::integer);


-- -----------------------------------------------------------------------------
-- SEZIONE 3: SETUP AVANZATO — ruolo dedicato (produzione con massima sicurezza)
--
-- Con il setup base, il proprietario del DB bypassa RLS per default.
-- Per forzare RLS anche sull'owner (FORCE ROW LEVEL SECURITY), crea un ruolo
-- dedicato "faniq_app" e connettiti con quello in produzione.
--
-- Esegui questa sezione come superuser su Neon prima del deploy in produzione.
-- -----------------------------------------------------------------------------

-- 1. Crea il ruolo applicativo (non superuser, non owner)
-- CREATE ROLE faniq_app LOGIN PASSWORD 'scegli-una-password-forte';

-- 2. Concedi i permessi sulle tabelle
-- GRANT USAGE ON SCHEMA public TO faniq_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO faniq_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO faniq_app;

-- 3. Forza RLS anche per l'owner (massima sicurezza)
-- ALTER TABLE fans           FORCE ROW LEVEL SECURITY;
-- ALTER TABLE abbonamenti    FORCE ROW LEVEL SECURITY;
-- ALTER TABLE biglietti      FORCE ROW LEVEL SECURITY;
-- ALTER TABLE shop_orders    FORCE ROW LEVEL SECURITY;
-- ALTER TABLE upload_history FORCE ROW LEVEL SECURITY;
-- ALTER TABLE privacy_log    FORCE ROW LEVEL SECURITY;

-- 4. Aggiorna FANIQ_DATABASE_URL in .env con le credenziali di faniq_app:
--    postgresql://faniq_app:password@ep-xxx.neon.tech/neondb?sslmode=require
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- SEZIONE 4: VERIFICA — query utili per testare che RLS funzioni
-- -----------------------------------------------------------------------------

-- Simula una request autenticata come club con id=1
-- SET LOCAL app.current_club_id = '1';
-- SELECT COUNT(*) FROM fans;   -- deve restituire solo i fan del club 1

-- Senza variabile impostata (nessuna row visibile grazie a NULLIF)
-- RESET app.current_club_id;
-- SELECT COUNT(*) FROM fans;   -- deve restituire 0 (o errore se FORCE RLS)

-- Verifica che gli indici esistano
-- SELECT indexname, tablename, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'ix_%'
-- ORDER BY tablename, indexname;
