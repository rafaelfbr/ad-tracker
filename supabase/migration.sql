-- Migration: Criação do schema e tabelas do Ad Tracker
-- Executar diretamente no Supabase SQL Editor

-- Criar schema dedicado para o projeto
CREATE SCHEMA IF NOT EXISTS adtracker;

-- Enum para status do tracker
CREATE TYPE adtracker.tracker_status AS ENUM ('active', 'paused');

-- Enum para fonte da coleta
CREATE TYPE adtracker.scrape_source AS ENUM ('auto', 'manual');

-- Tabela principal de rastreamentos
CREATE TABLE adtracker.trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_url TEXT NOT NULL,
  offer_name TEXT NOT NULL,
  niche TEXT NOT NULL,
  offer_url TEXT NOT NULL,
  status adtracker.tracker_status NOT NULL DEFAULT 'active',
  auto_track_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de resultados de scraping
CREATE TABLE adtracker.scrape_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id UUID NOT NULL REFERENCES adtracker.trackers(id) ON DELETE CASCADE,
  ad_count INTEGER NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source adtracker.scrape_source NOT NULL DEFAULT 'auto'
);

-- Índices para performance
CREATE INDEX idx_scrape_results_tracker_id ON adtracker.scrape_results(tracker_id);
CREATE INDEX idx_scrape_results_scraped_at ON adtracker.scrape_results(scraped_at DESC);
CREATE INDEX idx_trackers_status ON adtracker.trackers(status);
CREATE INDEX idx_trackers_auto_track_until ON adtracker.trackers(auto_track_until);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION adtracker.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trackers_updated_at
  BEFORE UPDATE ON adtracker.trackers
  FOR EACH ROW
  EXECUTE FUNCTION adtracker.update_updated_at_column();

-- Dar permissão ao role anon e authenticated para acessar o schema
GRANT USAGE ON SCHEMA adtracker TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA adtracker TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA adtracker TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA adtracker GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA adtracker GRANT ALL ON SEQUENCES TO anon, authenticated;
