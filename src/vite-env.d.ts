/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_CORE_URL?: string
  readonly VITE_API_FINANCIAL_URL?: string
  readonly VITE_API_LIFESTYLE_URL?: string
  readonly VITE_AWS_ACCESS_KEY_ID?: string
  readonly VITE_AWS_SECRET_ACCESS_KEY?: string
  readonly VITE_AWS_REGION?: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.md?raw' {
  const content: string
  export default content
}
