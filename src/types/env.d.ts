declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV?: 'development' | 'production';
        PORT?: string;
        APP_NAME?: string;

        LOGGING_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
        LOGGING_FORMAT?: 'console' | 'json';
        LOGGING_DIRECTORY?: string;
        LOGGING_SLOW_REQUEST_THRESHOLD_MS?: string;
        LOGGING_RETENTION_DAYS?: string;
    }
}
