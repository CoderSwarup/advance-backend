import type { NextFunction, Request, Response } from 'express';
import { __CONFIG__ } from '../config/config.js';
import errorObject from '../utils/errorObject.js';
import logger from '../utils/logger.js';

export default (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const errorObj = errorObject(err, req);
    const { statusCode } = errorObj;

    logger[statusCode >= 500 ? 'error' : 'warn'](statusCode >= 500 ? 'UNHANDLED_ERROR' : 'REQUEST_ERROR', {
        meta: {
            statusCode,
            method: req.method,
            url: req.originalUrl,
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : null,
            environment: __CONFIG__.env,
        },
    });

    res.status(statusCode).json(errorObj);
};
