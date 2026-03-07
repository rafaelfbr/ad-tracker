# PRD — Espionagem de Anúncios (Meta Ad Library Tracker)

## 1. Visão Geral

Plataforma web para **monitoramento automatizado de anúncios** na Biblioteca de Anúncios do Meta (Facebook). O usuário cadastra a URL de uma página dentro da Biblioteca de Anúncios e a plataforma faz scraping periodicamente, registrando a **quantidade de anúncios ativos** ao longo do tempo.

**Objetivo:** Permitir que o usuário acompanhe a evolução da quantidade de anúncios de concorrentes/referências, identificando tendências de escala e pausa de campanhas.

---

## 2. Stack Tecnológica

| Camada             | Tecnologia                                     |
| ------------------ | ---------------------------------------------- |
| Frontend / Backend | **Next.js** (App Router)                       |
| UI / UX            | **shadcn/ui** + Tailwind CSS                   |
| Banco de Dados     | **Supabase self-hosted** (já instalado na VPS) |
| Scraping           | **Playwright** (headless browser)              |
| Agendamento        | **node-cron** (dentro do próprio Next.js)      |
| Deploy             | **EasyPanel** (VPS Hostner)                    |

---

## 3. Funcionalidades

### 3.1 Cadastro de Rastreamento

O usuário preenche um formulário com:

| Campo             | Tipo           | Obrigatório | Descrição                                        |
| ----------------- | -------------- | ----------- | ------------------------------------------------ |
| URL da Biblioteca | `string (URL)` | ✅          | URL da página na Biblioteca de Anúncios do Meta  |
| Nome da Oferta    | `string`       | ✅          | Nome de identificação da oferta/produto          |
| Nicho             | `string`       | ✅          | Categoria/nicho do produto (ex: Saúde, Finanças) |
| URL da Oferta     | `string (URL)` | ✅          | Link da página de vendas/oferta                  |

**Regras:**

- Ao cadastrar, o rastreamento automático é ativado por **7 dias corridos**
- Após os 7 dias, o status muda para **"Pausado"**
- O usuário pode solicitar um scraping manual a qualquer momento via botão

### 3.2 Scraping Automatizado

- **Frequência:** 3 vezes ao dia — **01:00**, **10:00**, **21:00** (horário de Brasília)
- **Dado coletado:** Quantidade de anúncios ativos exibida na página (ex: "~230 resultados")
- **Período automático:** 7 dias a partir do cadastro
- Após 7 dias, o scraping automático é **desativado**
- O scraping manual continua disponível via botão na interface
- **Execução sequencial:** nunca rodar dois scrapings em paralelo — fila simples, o próximo espera o anterior terminar

### 3.3 Dashboard / Listagem

- Listagem de todos os rastreamentos cadastrados
- Para cada item exibir:
  - Nome da Oferta
  - Nicho
  - URL da Oferta (link clicável)
  - Status: **Ativo** (rastreando) / **Pausado** (7 dias expirados)
  - Último número de anúncios coletado
  - Data/hora da última coleta
  - Botão **"Coletar Agora"** (scraping manual)
  - Botão **"Ver Histórico"**

### 3.4 Histórico de Coletas

- Gráfico de linha mostrando a evolução da quantidade de anúncios ao longo do tempo
- Tabela com registro de cada coleta:
  - Data/hora
  - Quantidade de anúncios

### 3.5 Ações do Usuário

| Ação                   | Descrição                                          |
| ---------------------- | -------------------------------------------------- |
| Cadastrar rastreamento | Formulário de cadastro com os campos acima         |
| Coletar manualmente    | Botão que dispara um scraping imediato             |
| Ver histórico          | Gráfico + tabela de evolução                       |
| Excluir rastreamento   | Remove o rastreamento e todo o histórico associado |
| Reativar rastreamento  | Reinicia o ciclo de 7 dias de coleta automática    |

---

## 4. Modelagem de Dados (Supabase / PostgreSQL)

### Tabela: `trackers`

| Coluna             | Tipo                      | Descrição                                                  |
| ------------------ | ------------------------- | ---------------------------------------------------------- |
| `id`               | `uuid` (PK)               | Identificador único                                        |
| `library_url`      | `text`                    | URL da Biblioteca de Anúncios do Meta                      |
| `offer_name`       | `text`                    | Nome da oferta                                             |
| `niche`            | `text`                    | Nicho/categoria                                            |
| `offer_url`        | `text`                    | URL da página de vendas                                    |
| `status`           | `enum('active','paused')` | Status do rastreamento automático                          |
| `auto_track_until` | `timestamptz`             | Data limite do rastreamento automático (cadastro + 7 dias) |
| `created_at`       | `timestamptz`             | Data de criação                                            |
| `updated_at`       | `timestamptz`             | Última atualização                                         |

### Tabela: `scrape_results`

| Coluna       | Tipo                    | Descrição                            |
| ------------ | ----------------------- | ------------------------------------ |
| `id`         | `uuid` (PK)             | Identificador único                  |
| `tracker_id` | `uuid` (FK → trackers)  | Referência ao rastreamento           |
| `ad_count`   | `integer`               | Quantidade de anúncios coletada      |
| `scraped_at` | `timestamptz`           | Data/hora da coleta                  |
| `source`     | `enum('auto','manual')` | Se a coleta foi automática ou manual |

---

## 5. Arquitetura de Alto Nível

```
VPS Hostner (EasyPanel)
│
├── Next.js (App Router)
│   ├── UI — shadcn/ui + Tailwind
│   ├── API Routes
│   └── node-cron (01:00 / 10:00 / 21:00)
│       └── Scraping Service (fila sequencial)
│           └── Playwright → Meta Ad Library
│
└── Supabase self-hosted (já instalado)
    └── PostgreSQL
        ├── trackers
        └── scrape_results
```

---

## 6. Fluxo Principal

1. **Cadastro:** Usuário preenche formulário → dados salvos na tabela `trackers` com `status = 'active'` e `auto_track_until = NOW() + 7 days`
2. **Scraping automático:** node-cron roda nos horários definidos → consulta `trackers` onde `status = 'active'` AND `auto_track_until > NOW()` → para cada tracker, adiciona à fila sequencial → faz scraping da URL → salva resultado em `scrape_results`
3. **Expiração:** Cron job também verifica trackers com `auto_track_until <= NOW()` e atualiza `status = 'paused'`
4. **Scraping manual:** Usuário clica em "Coletar Agora" → API enfileira scraping imediato → salva resultado com `source = 'manual'`
5. **Reativação:** Usuário clica em "Reativar" → `auto_track_until` é recalculado para `NOW() + 7 days` e `status = 'active'`

---

## 7. Páginas da Aplicação

| Rota            | Descrição                                          |
| --------------- | -------------------------------------------------- |
| `/`             | Dashboard — listagem de todos os rastreamentos     |
| `/new`          | Formulário de cadastro de novo rastreamento        |
| `/tracker/[id]` | Detalhes + histórico de um rastreamento específico |

---

## 8. Considerações Técnicas

### Scraping

- A Biblioteca de Anúncios do Meta é renderizada via JavaScript, portanto é necessário **headless browser** (Playwright)
- O dado alvo é o texto **"~X resultados"** exibido no topo da página
- Deve-se tratar cenários de falha: página não carregou, layout mudou, rate limiting
- Implementar **retry** com backoff exponencial em caso de falha
- **Execução sequencial obrigatória** — nunca abrir múltiplas instâncias do browser em paralelo para preservar RAM

### Infraestrutura

- VPS com **16.4GB de RAM** — Playwright consome ~400–500MB por scraping, adequado desde que instâncias não rodem em paralelo
- **Supabase self-hosted** já disponível na VPS — não é necessário conta no Supabase Cloud
- **node-cron** roda dentro do processo Next.js, sem necessidade de serviço externo de agendamento

### Rate Limiting & Ética

- Respeitar os termos de uso do Meta
- Limitar frequência de requisições para evitar bloqueio
- Usar **User-Agent** rotativo e delays aleatórios entre requisições

### Autenticação

- Fase inicial: **sem autenticação** (uso pessoal)
- Futuramente: integrar Supabase Auth se necessário

---

## 9. MVP — Escopo da Primeira Versão

- [ ] Cadastro de rastreamentos (formulário)
- [ ] Listagem de rastreamentos no dashboard
- [ ] Scraping automático 3x/dia (01:00, 10:00, 21:00) via node-cron
- [ ] Rastreamento automático por 7 dias
- [ ] Scraping manual via botão
- [ ] Histórico com gráfico de evolução
- [ ] Reativação de rastreamento
- [ ] Exclusão de rastreamento

---

## 10. Fora do Escopo (v1)

- Autenticação de usuários
- Notificações (e-mail, push, WhatsApp)
- Análise avançada de criativos (imagens/vídeos dos anúncios)
- Exportação de relatórios (PDF/CSV)
- Multi-tenancy (múltiplos usuários)
