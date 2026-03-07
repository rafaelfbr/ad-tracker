// Tipos TypeScript para o banco de dados Supabase (schema: adtracker)

export type TrackerStatus = 'active' | 'paused'
export type ScrapeSource = 'auto' | 'manual'

export interface Tracker {
  id: string
  library_url: string
  offer_name: string
  niche: string
  offer_url: string
  status: TrackerStatus
  auto_track_until: string
  created_at: string
  updated_at: string
}

export interface ScrapeResult {
  id: string
  tracker_id: string
  ad_count: number
  scraped_at: string
  source: ScrapeSource
}

// Tipo para tracker com último resultado (usado no dashboard)
export interface TrackerWithLastResult extends Tracker {
  last_ad_count: number | null
  last_scraped_at: string | null
}

// Tipo para criação de tracker
export interface CreateTrackerInput {
  library_url: string
  offer_name: string
  niche: string
  offer_url: string
}

// Tipos do Supabase Database
// Usamos 'public' como chave pois o client infere os tipos a partir dela,
// mesmo que o schema real seja 'adtracker' (configurado no createClient)
export interface Database {
  public: {
    Tables: {
      trackers: {
        Row: Tracker
        Insert: {
          library_url: string
          offer_name: string
          niche: string
          offer_url: string
          id?: string
          status?: TrackerStatus
          auto_track_until?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          library_url?: string
          offer_name?: string
          niche?: string
          offer_url?: string
          status?: TrackerStatus
          auto_track_until?: string
          updated_at?: string
        }
      }
      scrape_results: {
        Row: ScrapeResult
        Insert: {
          tracker_id: string
          ad_count: number
          source: ScrapeSource
          id?: string
          scraped_at?: string
        }
        Update: {
          tracker_id?: string
          ad_count?: number
          source?: ScrapeSource
          scraped_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      tracker_status: TrackerStatus
      scrape_source: ScrapeSource
    }
  }
}
