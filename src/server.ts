import type { Server } from 'node:http';
// MUST be first: starts OpenTelemetry before Express/http are loaded
import tracing from './utils/tracing.js';
import app from './app.js';
import { __CONFIG__ } from './config/config.js';
import logger from './utils/logger.js';

const server: Server = app.listen(__CONFIG__.server.port, () => {
    logger.info('SERVER_STARTED', {
        meta: {
            port: __CONFIG__.server.port,
            env: __CONFIG__.env,
            pid: process.pid,
            url: `http://localhost:${__CONFIG__.server.port}`,
        },
    });
});

const shutdown = (signal: string): void => {
    logger.info('SERVER_SHUTDOWN', { meta: { signal } });

    server.close(async (err) => {
        if (err) {
            logger.error('SERVER_SHUTDOWN_ERROR', { meta: { message: err.message } });
            process.exit(1);
        }

        await tracing.shutdown().catch((error: unknown) => {
            logger.error('TRACING_SHUTDOWN_ERROR', {
                meta: { message: error instanceof Error ? error.message : String(error) },
            });
        });

        logger.info('SERVER_STOPPED');
        process.exit(0);
    });

    setTimeout(() => {
        logger.error('SERVER_FORCED_SHUTDOWN', { meta: { signal } });
        process.exit(1);
    }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    logger.error('UNHANDLED_REJECTION', {
        meta: { reason: reason instanceof Error ? reason.stack : String(reason) },
    });
});

process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT_EXCEPTION', { meta: { message: err.message, stack: err.stack } });
    shutdown('uncaughtException');
});

export default server;
