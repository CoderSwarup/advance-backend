import type { Request } from 'express';
import { __CONFIG__ } from '../config/config.js';
import { responseMessage } from '../constants/index.js';
import HttpError from './httpError.js';

interface ErrorObject {
    success: false;
    statusCode: number;
    request: {
        ip?: string | null;
        method: string;
        url: string;
    };
    message: string;
    data: null;
    trace?: { error?: string } | null;
}

const resolveStatusCode = (err: unknown, fallback: number): number => {
    if (err instanceof HttpError) return err.statusCode;
    if (
        typeof err === 'object' &&
        err !== null &&
        'statusCode' in err &&
        typeof err.statusCode === 'number'
    ) {
        return err.statusCode;
    }
    return fallback;
};

const resolveMessage = (err: unknown): string => {
    if (!(err instanceof Error) || !err.message) {
        return responseMessage.ERROR.SOMETHING_WENT_WRONG;
    }

    const isOperational = err instanceof HttpError ? err.isOperational : !__CONFIG__.isProduction;

    return isOperational ? err.message : responseMessage.ERROR.SOMETHING_WENT_WRONG;
};

export default (err: unknown, req: Request, fallbackStatusCode = 500): ErrorObject => {
    const errorObj: ErrorObject = {
        success: false,
        statusCode: resolveStatusCode(err, fallbackStatusCode),
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl,
        },
        message: resolveMessage(err),
        data: null,
        trace: err instanceof Error ? { error: err.stack } : null,
    };

    if (__CONFIG__.isProduction) {
        delete errorObj.request.ip;
        delete errorObj.trace;
    }

    return errorObj;
};
