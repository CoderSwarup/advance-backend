import type { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.js';

export default (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

        const meta = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            userAgent: req.get('user-agent') ?? null,
        };

        if (res.statusCode >= 500) {
            logger.error('HTTP_REQUEST_FAILED', { meta });
        } else if (res.statusCode >= 400) {
            logger.warn('HTTP_REQUEST_ERROR', { meta });
        } else {
            logger.info('HTTP_REQUEST', { meta });
        }
    });

    next();
};
