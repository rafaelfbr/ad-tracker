-- Migration: Criação da tabela de configurações
-- Executar diretamente no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS adtracker.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir chave padrão para o Meta Access Token (se não existir)
INSERT INTO adtracker.settings (key, value)
VALUES ('META_ACCESS_TOKEN', '')
ON CONFLICT (key) DO NOTHING;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON adtracker.settings
  FOR EACH ROW
  EXECUTE FUNCTION adtracker.update_updated_at_column();

-- Permissões
GRANT ALL ON adtracker.settings TO anon, authenticated;
