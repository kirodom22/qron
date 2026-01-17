/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_TRON_NETWORK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  tronLink?: any;
  tronWeb?: any;
}
