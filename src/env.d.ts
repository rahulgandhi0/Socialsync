/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_INSTAGRAM_APP_ID: string
  readonly VITE_INSTAGRAM_APP_SECRET: string
  readonly VITE_INSTAGRAM_REDIRECT_URI: string
  readonly VITE_SENTRY_DSN?: string
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 