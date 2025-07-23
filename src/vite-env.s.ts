interface ImportMetaEnv {
    DEV: any;
    readonly VITE_CKEY1: string;
    readonly VITE_CKEY2: string;
    readonly VITE_REACT_APP_BACKEND_URL:string;
  // agrega más si las necesitas
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}