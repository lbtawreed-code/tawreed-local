/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add any other custom environment variables here if you have them
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
