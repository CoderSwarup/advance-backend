import dotenv from 'dotenv';
import { EApplicationEnvironment, type ApplicationEnvironment } from '../constants/index.js';

dotenv.config({ quiet: true });

const rawEnv = process.env.NODE_ENV ?? EApplicationEnvironment.DEVELOPMENT;

const env: ApplicationEnvironment = Object.values(EApplicationEnvironment).includes(rawEnv as ApplicationEnvironment)
    ? (rawEnv as ApplicationEnvironment)
    : EApplicationEnvironment.DEVELOPMENT;

export const __CONFIG__ = Object.freeze({
    env,
    isProduction: env === EApplicationEnvironment.PRODUCTION,
    server: Object.freeze({
        appName: process.env.APP_NAME ?? 'advance-backend',
        port: Number(process.env.PORT ?? 3000),
    }),
    logging: Object.freeze({
        logLevel: process.env.LOG_LEVEL ?? (env === EApplicationEnvironment.PRODUCTION ? 'info' : 'debug'),
    }),
});
export type Config = typeof __CONFIG__;

