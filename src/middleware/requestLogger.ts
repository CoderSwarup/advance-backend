import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { __CONFIG__ } from '../config/config.js';
import logger from '../utils/logger.js';

const REQUEST_ID_PATTERN = /^[\w.-]{1,128}$/;

const resolveRequestId = (req: Request): string => {
    const incoming = req.get('x-request-id');
    return incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
};

export default (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();
    const requestId = resolveRequestId(req);

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const slow = durationMs >= __CONFIG__.logging.slowRequestThresholdMs;

        const meta = {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            slow,
            userAgent: req.get('user-agent') ?? null,
        };

        if (res.statusCode >= 500) {
            logger.error('HTTP_REQUEST_FAILED', { meta });
        } else if (res.statusCode >= 400) {
            logger.warn('HTTP_REQUEST_ERROR', { meta });
        } else if (slow) {
            logger.warn('HTTP_REQUEST_SLOW', { meta });
        } else {
            logger.info('HTTP_REQUEST', { meta });
        }
    });

    next();
};
