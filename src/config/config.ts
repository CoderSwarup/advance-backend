import dotenv from 'dotenv';
import { EApplicationEnvironment, type ApplicationEnvironment } from '../constants/index.js';

dotenv.config({ quiet: true });

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
const LOG_FORMATS = ['console', 'json'] as const;

const rawEnv = process.env.NODE_ENV ?? EApplicationEnvironment.DEVELOPMENT;

const env: ApplicationEnvironment = Object.values(EApplicationEnvironment).includes(rawEnv as ApplicationEnvironment)
    ? (rawEnv as ApplicationEnvironment)
    : EApplicationEnvironment.DEVELOPMENT;

const isProduction = env === EApplicationEnvironment.PRODUCTION;

const resolveChoice = <T extends string>(raw: string | undefined, choices: readonly T[], fallback: T): T =>
    choices.includes(raw as T) ? (raw as T) : fallback;

const resolvePositiveInt = (raw: string | undefined, fallback: number): number => {
    const value = Number(raw);
    return Number.isInteger(value) && value > 0 ? value : fallback;
};

const resolveBoolean = (raw: string | undefined, fallback: boolean): boolean =>
    raw === 'true' ? true : raw === 'false' ? false : fallback;

export const __CONFIG__ = Object.freeze({
    env,
    isProduction,
    server: Object.freeze({
        appName: process.env.APP_NAME ?? 'advance-backend',
        port: resolvePositiveInt(process.env.PORT, 8000),
    }),
    logging: Object.freeze({
        level: resolveChoice(process.env.LOGGING_LEVEL, LOG_LEVELS, isProduction ? 'info' : 'debug'),
        format: resolveChoice(process.env.LOGGING_FORMAT, LOG_FORMATS, isProduction ? 'json' : 'console'),
        directory: process.env.LOGGING_DIRECTORY ?? 'logs',
        slowRequestThresholdMs: resolvePositiveInt(process.env.LOGGING_SLOW_REQUEST_THRESHOLD_MS, 200),
        retentionDays: resolvePositiveInt(process.env.LOGGING_RETENTION_DAYS, 7),
        loki: Object.freeze({
            enabled: resolveBoolean(process.env.LOKI_ENABLED, false),
            url: process.env.LOKI_URL ?? 'http://localhost:3100',
        }),
    }),
    monitoring: Object.freeze({
        enabled: resolveBoolean(process.env.MONITORING_ENABLED, true),
    }),
    tracing: Object.freeze({
        enabled: resolveBoolean(process.env.TRACING_ENABLED, false),
        otlpUrl: process.env.TRACING_OTLP_URL ?? 'http://localhost:4318/v1/traces',
    }),
});

export type Config = typeof __CONFIG__;
