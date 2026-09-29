import type { Request, Response } from 'express';
import { __CONFIG__ } from '../config/config.js';
import logger from './logger.js';

interface HttpResponse<T> {
    success: true;
    statusCode: number;
    request: {
        ip?: string | null;
        method: string;
        url: string;
    };
    message: string;
    data: T | null;
}

export default <T = unknown>(
    req: Request,
    res: Response,
    responseStatusCode: number,
    responseMessage: string,
    data: T | null = null,
): void => {
    const response: HttpResponse<T> = {
        success: true,
        statusCode: responseStatusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl,
        },
        message: responseMessage,
        data,
    };

    if (__CONFIG__.isProduction) {
        delete response.request.ip;
    }

    logger.info('CONTROLLER_RESPONSE', {
        meta: {
            statusCode: responseStatusCode,
            method: req.method,
            url: req.originalUrl,
        },
    });

    res.status(responseStatusCode).json(response);
};
