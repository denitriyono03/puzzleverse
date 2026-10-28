/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_ADS_ENABLED?: string; readonly VITE_APP_NAME?: string }
interface ImportMeta { readonly env: ImportMetaEnv }
