/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Типы для Vite env переменных
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_TONCONNECT_MANIFEST_URL?: string;
  readonly VITE_DOCS_URL?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Типы для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        initData: string;
        startParam?: string;
        close: () => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
      };
    };
  }
}

export { };

