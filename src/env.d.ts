declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV?: 'development' | 'production';
        PORT?: string;
        APP_NAME?: string;
        LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
    }
}
