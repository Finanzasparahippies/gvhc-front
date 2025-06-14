interface ImportMetaEnv {
    readonly VITE_CKEY1: string;
    readonly VITE_CKEY2: string;
  // agrega más si las necesitas
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}